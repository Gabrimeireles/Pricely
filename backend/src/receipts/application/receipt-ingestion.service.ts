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
    const extractionInput: ReceiptIngestionRequest = {
      ...sanitizedRequest,
      accessKey: sanitizedRequest.accessKey ?? qrCodeData.accessKey,
      qrCodeUrl: qrCodeData.sefazUrl ?? sanitizedRequest.qrCodeUrl,
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
          id: `rli_${crypto.randomUUID()}`,
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

    const receiptRecordId = `rr_${crypto.randomUUID()}`;
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
      rewardPoints: assessedRecord.rewardEligibilityStatus === 'eligible_pending' ? 100 : 0,
      rewardOptimizationTokens:
        assessedRecord.rewardEligibilityStatus === 'eligible_pending' ? 1 : 0,
      rewardMessage:
        assessedRecord.rewardEligibilityStatus === 'eligible_pending'
          ? 'Nota recebida: reward em processamento ate a liberacao e validacao.'
          : 'Nota recebida para revisao.',
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
      rewardPoints: record.rewardEligibilityStatus === 'eligible_pending' ? 100 : 0,
      rewardOptimizationTokens:
        record.rewardEligibilityStatus === 'eligible_pending' ? 1 : 0,
      rewardMessage:
        record.rewardEligibilityStatus === 'granted'
          ? 'Nota validada: voce ganhou 100 pontos e 1 credito de otimizacao.'
          : 'Nota recebida: reward em processamento ate a liberacao e validacao.',
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
}
