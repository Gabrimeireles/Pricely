import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bullmq';

import { type ReceiptIngestionRequest, type ReceiptRecord } from '../../common/contracts';
import {
  RECEIPT_PROCESSING_QUEUE,
  type ReceiptProcessingJob,
} from '../../common/queue/queue.tokens';
import { toSlug } from '../../common/utils/slug.util';
import { ProductMatchService } from '../../catalog/application/product-match.service';
import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';
import { ReceiptRecordRepository } from '../infrastructure/receipt-record.repository';
import { ReceiptParserService } from './receipt-parser.service';
import { StoreOfferRepository } from '../../stores/infrastructure/store-offer.repository';

@Injectable()
export class ReceiptIngestionService {
  private readonly logger = new Logger(ReceiptIngestionService.name);

  constructor(
    private readonly receiptParserService: ReceiptParserService,
    private readonly productMatchService: ProductMatchService,
    private readonly receiptRecordRepository: ReceiptRecordRepository,
    private readonly storeOfferRepository: StoreOfferRepository,
    @Inject(RECEIPT_PROCESSING_QUEUE)
    private readonly receiptProcessingQueue: Queue<ReceiptProcessingJob>,
  ) {}

  async ingest(request: ReceiptIngestionRequest): Promise<ReceiptRecord> {
    const parsedReceipt = this.receiptParserService.parse(request);
    const storeId = `store_${toSlug(parsedReceipt.storeName || 'unknown')}`;

    const lineItems = await Promise.all(
      parsedReceipt.items.map(async (item) => {
        const match = await this.productMatchService.resolve(item.rawProductName);

        return {
          id: `rli_${crypto.randomUUID()}`,
          receiptRecordId: '',
          rawProductName: item.rawProductName,
          normalizedName: match.canonicalName,
          packageSize: item.packageSize,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currency: item.currency,
          matchConfidence: item.matchConfidence,
        };
      }),
    );

    const receiptRecordId = `rr_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const record: ReceiptRecordEntity = {
      id: receiptRecordId,
      storeId,
      storeName: parsedReceipt.storeName,
      purchaseDate: parsedReceipt.purchaseDate,
      sourceType: request.sourceType || 'manual_entry',
      parseStatus: parsedReceipt.parseStatus,
      confidenceScore: parsedReceipt.confidenceScore,
      lineItems: lineItems.map((lineItem) => ({
        ...lineItem,
        receiptRecordId,
      })),
      createdAt: now,
      updatedAt: now,
    };

    await this.receiptRecordRepository.create(record);
    await Promise.all(
      record.lineItems.map((lineItem) =>
        this.storeOfferRepository.upsert({
          id: `offer_${record.storeId}_${lineItem.normalizedName}_${lineItem.packageSize || 'default'}`,
          storeId: record.storeId,
          storeName: record.storeName,
          canonicalName: lineItem.normalizedName,
          displayName: lineItem.rawProductName,
          price: lineItem.unitPrice,
          quantityContext: lineItem.packageSize,
          availabilityStatus: 'available',
          confidenceScore: lineItem.matchConfidence,
          sourceReceiptLineItemId: lineItem.id,
          observedAt: record.purchaseDate || record.createdAt,
        }),
      ),
    );
    await this.receiptProcessingQueue.add('receipt-processing', {
      receiptRecordId,
    });

    this.logger.log(
      `Receipt ${receiptRecordId} ingested with status ${record.parseStatus} and ${record.lineItems.length} line items`,
    );

    return {
      id: record.id,
      storeId: record.storeId,
      purchaseDate: record.purchaseDate,
      parseStatus: record.parseStatus,
      confidenceScore: record.confidenceScore,
    };
  }
}
