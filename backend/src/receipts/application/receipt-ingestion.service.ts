import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Queue } from 'bullmq';

import {
  type ReceiptIngestionRequest,
  type ReceiptRecord,
} from '../../common/contracts';
import {
  RECEIPT_PROCESSING_QUEUE,
  type ReceiptProcessingJob,
} from '../../common/queue/queue.tokens';
import { toSlug } from '../../common/utils/slug.util';
import { ProductMatchService } from '../../catalog/application/product-match.service';
import { ProcessingJobsService } from '../../processing/application/processing-jobs.service';
import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';
import { ReceiptRecordRepository } from '../infrastructure/receipt-record.repository';
import { QrCodeParserService } from './qr-code-parser.service';
import { ReceiptContributionQualityService } from './receipt-contribution-quality.service';
import { ReceiptParserService } from './receipt-parser.service';
import { ReceiptSanitizerService } from './receipt-sanitizer.service';

@Injectable()
export class ReceiptIngestionService {
  private readonly logger = new Logger(ReceiptIngestionService.name);

  constructor(
    private readonly receiptParserService: ReceiptParserService,
    private readonly receiptSanitizerService: ReceiptSanitizerService,
    private readonly qrCodeParserService: QrCodeParserService,
    private readonly productMatchService: ProductMatchService,
    private readonly receiptContributionQualityService: ReceiptContributionQualityService,
    private readonly receiptRecordRepository: ReceiptRecordRepository,
    private readonly processingJobsService: ProcessingJobsService,
    @Inject(RECEIPT_PROCESSING_QUEUE)
    private readonly receiptProcessingQueue: Queue<ReceiptProcessingJob>,
  ) {}

  async ingest(
    userId: string,
    request: ReceiptIngestionRequest,
  ): Promise<ReceiptRecord> {
    const sanitizedRequest =
      this.receiptSanitizerService.sanitizeRequest(request);
    const qrCodeData = this.qrCodeParserService.parse(
      sanitizedRequest.qrCodeUrl ?? sanitizedRequest.accessKey,
    );
    const shouldFetchSefaz =
      !sanitizedRequest.storeName ||
      !sanitizedRequest.storeCnpj ||
      !sanitizedRequest.purchaseDate ||
      !sanitizedRequest.items ||
      sanitizedRequest.items.length === 0;
    const sefazExtraction = shouldFetchSefaz
      ? await this.extractSefazReceipt(
          qrCodeData.sefazUrl ?? sanitizedRequest.qrCodeUrl,
        )
      : {};
    const extractionInput: ReceiptIngestionRequest = {
      ...sanitizedRequest,
      storeName: sanitizedRequest.storeName ?? sefazExtraction.storeName,
      storeCnpj: sanitizedRequest.storeCnpj ?? sefazExtraction.storeCnpj,
      purchaseDate:
        sanitizedRequest.purchaseDate ?? sefazExtraction.purchaseDate,
      accessKey: sanitizedRequest.accessKey ?? qrCodeData.accessKey,
      qrCodeUrl: qrCodeData.sefazUrl ?? sanitizedRequest.qrCodeUrl,
      items:
        sanitizedRequest.items && sanitizedRequest.items.length > 0
          ? sanitizedRequest.items
          : sefazExtraction.items,
    };
    const parsedReceipt = this.receiptParserService.parse(extractionInput);
    const storeId = parsedReceipt.storeName
      ? `store_${toSlug(parsedReceipt.storeName)}`
      : undefined;

    const lineItems = await Promise.all(
      parsedReceipt.items.map(async (item) => {
        const match = await this.productMatchService.resolve(
          item.rawProductName,
        );

        return {
          id: crypto.randomUUID(),
          receiptRecordId: '',
          ean: item.ean,
          rawProductName: item.rawProductName,
          normalizedName: match.canonicalName,
          packageSize: item.packageSize,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalUnitPrice: item.originalUnitPrice,
          promotionalUnitPrice: item.promotionalUnitPrice,
          currency: item.currency,
          matchConfidence: item.matchConfidence,
        };
      }),
    );

    const receiptRecordId = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: ReceiptRecordEntity = {
      id: receiptRecordId,
      userId,
      storeId,
      storeName: parsedReceipt.storeName,
      storeCnpj: parsedReceipt.storeCnpj,
      accessKey: parsedReceipt.accessKey,
      sefazUrl: parsedReceipt.sefazUrl,
      purchaseDate: parsedReceipt.purchaseDate,
      sourceType:
        extractionInput.sourceType || this.inferSourceType(extractionInput),
      parseStatus: lineItems.length > 0 ? parsedReceipt.parseStatus : 'queued',
      confidenceScore: parsedReceipt.confidenceScore,
      rawSourceReference: this.buildRawSourceReference(extractionInput),
      processingLogs: [
        'receipt_received',
        ...parsedReceipt.issues.map((issue) => `parse_issue:${issue}`),
      ],
      lineItems: lineItems.map((lineItem) => ({
        ...lineItem,
        receiptRecordId,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const assessment =
      await this.receiptContributionQualityService.assess(record);
    const assessedRecord: ReceiptRecordEntity = {
      ...record,
      duplicateKey: assessment.duplicateKey,
      trustLevel: assessment.trustLevel,
      moderationStatus: assessment.moderationStatus,
      rewardEligibilityStatus: assessment.rewardEligibilityStatus,
      reviewReason: assessment.reviewReason,
      processingLogs: [...record.processingLogs, ...assessment.logs],
    };

    await this.receiptRecordRepository.create(assessedRecord);
    const processingJob = this.isAutomaticReceiptProcessingEnabled()
      ? await this.enqueueReceiptProcessing(receiptRecordId)
      : null;

    this.logger.log(
      `Receipt ${receiptRecordId} ingested with status ${assessedRecord.parseStatus} and processing mode ${processingJob ? 'automatic' : 'manual'}`,
    );

    return {
      id: assessedRecord.id,
      storeId: assessedRecord.storeId,
      storeName: assessedRecord.storeName,
      storeCnpj: assessedRecord.storeCnpj,
      accessKey: assessedRecord.accessKey,
      sefazUrl: assessedRecord.sefazUrl,
      purchaseDate: assessedRecord.purchaseDate,
      parseStatus: assessedRecord.parseStatus,
      confidenceScore: assessedRecord.confidenceScore,
      trustLevel: assessedRecord.trustLevel,
      moderationStatus: assessedRecord.moderationStatus,
      rewardEligibilityStatus: assessedRecord.rewardEligibilityStatus,
      ...this.projectReward(assessedRecord.rewardEligibilityStatus),
      reviewReason: assessedRecord.reviewReason,
      jobId: processingJob?.id,
      processingStatus: processingJob ? 'queued' : 'waiting_manual_release',
      dataNotice:
        'Prices and receipt data are based on receipts provided by users.',
    };
  }

  async releaseForProcessing(receiptRecordId: string): Promise<ReceiptRecord> {
    const record = await this.receiptRecordRepository.findById(receiptRecordId);
    if (!record) {
      throw new NotFoundException(`Receipt ${receiptRecordId} was not found`);
    }

    if (record.processingJobId) {
      return this.projectReceiptRecord(record);
    }

    const processingJob = await this.enqueueReceiptProcessing(receiptRecordId);
    const releasedRecord =
      await this.receiptRecordRepository.findById(receiptRecordId);

    return {
      ...this.projectReceiptRecord(releasedRecord ?? record),
      jobId: processingJob.id,
      processingStatus: 'queued',
    };
  }

  private async enqueueReceiptProcessing(receiptRecordId: string) {
    const processingJob = await this.processingJobsService.createQueuedJob({
      queueName: 'receipt-processing',
      jobType: 'receipt_processing',
      resourceType: 'receipt_record',
      resourceId: receiptRecordId,
    });
    await this.receiptRecordRepository.attachProcessingJob(
      receiptRecordId,
      processingJob.id,
    );
    await this.receiptProcessingQueue.add(
      'receipt-processing',
      {
        receiptRecordId,
        processingJobId: processingJob.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return processingJob;
  }

  private projectReceiptRecord(record: ReceiptRecordEntity): ReceiptRecord {
    return {
      id: record.id,
      storeId: record.storeId,
      storeName: record.storeName,
      storeCnpj: record.storeCnpj,
      accessKey: record.accessKey,
      sefazUrl: record.sefazUrl,
      purchaseDate: record.purchaseDate,
      parseStatus: record.parseStatus,
      confidenceScore: record.confidenceScore,
      trustLevel: record.trustLevel,
      moderationStatus: record.moderationStatus,
      rewardEligibilityStatus: record.rewardEligibilityStatus,
      ...this.projectReward(record.rewardEligibilityStatus),
      reviewReason: record.reviewReason,
      jobId: record.processingJobId,
      processingStatus: record.processingStatus ?? 'waiting_manual_release',
      dataNotice:
        'Prices and receipt data are based on receipts provided by users.',
    };
  }

  private isAutomaticReceiptProcessingEnabled(): boolean {
    return process.env.RECEIPT_PROCESSING_MODE === 'automatic';
  }

  private projectReward(
    status: ReceiptRecordEntity['rewardEligibilityStatus'],
  ): Pick<
    ReceiptRecord,
    'rewardPoints' | 'rewardOptimizationTokens' | 'rewardMessage'
  > {
    if (status === 'granted') {
      return {
        rewardPoints: 100,
        rewardOptimizationTokens: 1,
        rewardMessage:
          'Nota validada: voce ganhou 100 pontos e 1 credito de otimizacao.',
      };
    }

    if (status === 'eligible_pending') {
      return {
        rewardPoints: 100,
        rewardOptimizationTokens: 1,
        rewardMessage:
          'Nota recebida: reward em processamento ate a liberacao e validacao.',
      };
    }

    if (status === 'ineligible') {
      return {
        rewardPoints: 0,
        rewardOptimizationTokens: 0,
        rewardMessage:
          'Nota recebida, mas sem reward por duplicidade ou falta de dados uteis.',
      };
    }

    return {
      rewardPoints: 0,
      rewardOptimizationTokens: 0,
      rewardMessage:
        'Nota recebida para revisao de qualidade antes de liberar reward.',
    };
  }

  private inferSourceType(
    input: ReceiptIngestionRequest,
  ): ReceiptRecordEntity['sourceType'] {
    if (input.uploadedFile?.mimeType === 'application/pdf') {
      return 'pdf_upload';
    }

    if (input.uploadedFile) {
      return 'image_parse';
    }

    if (input.qrCodeUrl) {
      return 'qr_code_url';
    }

    return 'manual_entry';
  }

  private buildRawSourceReference(
    input: ReceiptIngestionRequest,
  ): string | undefined {
    if (input.uploadedFile) {
      return JSON.stringify({
        storageKey: input.uploadedFile.storageKey,
        originalFilename: input.uploadedFile.originalFilename,
        mimeType: input.uploadedFile.mimeType,
        sizeBytes: input.uploadedFile.sizeBytes,
      });
    }

    if (input.qrCodeUrl || input.accessKey) {
      return JSON.stringify({
        accessKey: input.accessKey,
        sefazUrl: input.qrCodeUrl,
      });
    }

    return undefined;
  }

  private async extractSefazReceipt(
    sefazUrl?: string,
  ): Promise<Partial<ReceiptIngestionRequest>> {
    if (!sefazUrl) {
      return {};
    }

    let url: URL;
    try {
      url = new URL(sefazUrl);
    } catch {
      return {};
    }

    if (!url.hostname.includes('fazenda') && !url.hostname.includes('sefaz')) {
      return {};
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            accept: 'text/html,application/xhtml+xml',
            'user-agent': 'PricelyReceiptParser/1.0',
          },
        });

        if (!response.ok) {
          this.logger.warn(
            `SEFAZ receipt extraction skipped for ${url.hostname}: HTTP ${response.status}`,
          );
          return {};
        }

        return this.parseSefazHtml(await response.text());
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown SEFAZ extraction error';
      this.logger.warn(`SEFAZ receipt extraction failed: ${message}`);
      return {};
    }
  }

  private parseSefazHtml(html: string): Partial<ReceiptIngestionRequest> {
    const text = this.decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    const storeName =
      this.matchText(text, /Nota Fiscal de Consumidor Eletrônica \(NFC-e\)\s+(.+?)\s+CNPJ:/i) ??
      this.matchText(text, /Emitente\s+Nome \/ Razão Social\s+CNPJ\s+Inscrição Estadual\s+UF\s+(.+?)\s+\d{14}/i);
    const storeCnpj = this.matchText(text, /CNPJ:\s*(\d{14})/i);
    const purchaseDate = this.parseBrazilianDate(
      this.matchText(text, /Data Emissão\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i),
    );
    const items = [...html.matchAll(/<tr>\s*<td><h7>([\s\S]*?)<\/h7>\s*\(Código:\s*([^)]+)\)<\/td>\s*<td>Qtde total de ítens:\s*([\d.,]+)<\/td>\s*<td>UN:\s*([^<]+)<\/td>\s*<td>Valor total R\$:\s*R\$\s*([\d.,]+)<\/td>\s*<\/tr>/gi)]
      .map((match) => {
        const rawProductName = this.decodeHtml(
          match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        );
        const quantity = this.parseBrazilianNumber(match[3]);
        const lineTotal = this.parseBrazilianNumber(match[5]);
        const unitPrice =
          quantity > 0 ? Number((lineTotal / quantity).toFixed(2)) : lineTotal;

        return {
          rawProductName,
          ean: match[2].trim(),
          quantity,
          unitPrice,
          originalUnitPrice: unitPrice,
          currency: 'BRL',
          packageSize: this.inferPackageSize(rawProductName),
        };
      })
      .filter((item) => item.rawProductName && item.unitPrice > 0);

    return {
      storeName,
      storeCnpj,
      purchaseDate,
      items: items.length > 0 ? items : undefined,
    };
  }

  private matchText(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern)?.[1]?.trim();
    return match ? this.decodeHtml(match).replace(/\s+/g, ' ') : undefined;
  }

  private parseBrazilianDate(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const match = value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
    );
    if (!match) {
      return undefined;
    }

    const [, day, month, year, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
  }

  private parseBrazilianNumber(value: string): number {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private inferPackageSize(rawProductName: string): string | undefined {
    const match = rawProductName.match(/\b(\d+(?:[,.]\d+)?)\s*(kg|g|ml|l|un)\b/i);
    if (!match) {
      return undefined;
    }

    return `${match[1].replace(',', '.')} ${match[2].toLowerCase()}`;
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}
