import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bullmq';

import { type ReceiptIngestionRequest, type ReceiptRecord } from '../../common/contracts';
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
    private readonly receiptRecordRepository: ReceiptRecordRepository,
    private readonly processingJobsService: ProcessingJobsService,
    @Inject(RECEIPT_PROCESSING_QUEUE)
    private readonly receiptProcessingQueue: Queue<ReceiptProcessingJob>,
  ) {}

  async ingest(userId: string, request: ReceiptIngestionRequest): Promise<ReceiptRecord> {
    const sanitizedRequest = this.receiptSanitizerService.sanitizeRequest(request);
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
        const match = await this.productMatchService.resolve(item.rawProductName);

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
      sourceType: extractionInput.sourceType || this.inferSourceType(extractionInput),
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

    await this.receiptRecordRepository.create(record);
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
    await this.receiptProcessingQueue.add('receipt-processing', {
      receiptRecordId,
      processingJobId: processingJob.id,
    }, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(
      `Receipt ${receiptRecordId} ingested with status ${record.parseStatus} and ${record.lineItems.length} line items`,
    );

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
      jobId: processingJob.id,
      processingStatus: 'queued',
      dataNotice: 'Prices and receipt data are based on receipts provided by users.',
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

  private buildRawSourceReference(input: ReceiptIngestionRequest): string | undefined {
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
