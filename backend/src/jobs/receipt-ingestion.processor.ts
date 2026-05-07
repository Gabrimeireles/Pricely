import { Injectable, Logger } from '@nestjs/common';

import { type ReceiptRecordEntity } from '../receipts/domain/receipt-record.entity';
import { ReceiptRecordRepository } from '../receipts/infrastructure/receipt-record.repository';
import { StoreOfferRepository } from '../stores/infrastructure/store-offer.repository';

@Injectable()
export class ReceiptIngestionProcessor {
  private readonly logger = new Logger(ReceiptIngestionProcessor.name);

  constructor(
    private readonly receiptRecordRepository: ReceiptRecordRepository,
    private readonly storeOfferRepository: StoreOfferRepository,
  ) {}

  async process(receiptRecordId: string): Promise<void> {
    const record = await this.receiptRecordRepository.findById(receiptRecordId);

    if (!record) {
      this.logger.warn(`Receipt ${receiptRecordId} was queued but could not be found`);
      return;
    }

    if (record.lineItems.length === 0) {
      await this.receiptRecordRepository.markExtractionFailed(
        receiptRecordId,
        'structured_provider_or_ocr_not_configured',
      );
      throw new Error('Receipt extraction provider or OCR extractor is not configured');
    }

    if (!record.storeId || !record.storeName) {
      await this.receiptRecordRepository.markExtractionFailed(
        receiptRecordId,
        'missing_store_identity',
      );
      throw new Error('Receipt store identity is required before creating price offers');
    }

    await this.persistStoreOffers({
      ...record,
      storeId: record.storeId,
      storeName: record.storeName,
    });
    this.logger.log(`Receipt ${receiptRecordId} processed into store offers`);
  }

  private async persistStoreOffers(
    record: ReceiptRecordEntity & { storeId: string; storeName: string },
  ): Promise<void> {
    await Promise.all(
      record.lineItems.map((lineItem) =>
        this.storeOfferRepository.upsert({
          id: `offer_${record.storeId}_${lineItem.normalizedName}_${lineItem.packageSize || 'default'}`,
          storeId: record.storeId,
          storeName: record.storeName,
          canonicalName: lineItem.normalizedName,
          displayName: lineItem.rawProductName,
          price: lineItem.unitPrice,
          basePrice: lineItem.originalUnitPrice ?? lineItem.unitPrice,
          promotionalPrice: lineItem.promotionalUnitPrice,
          quantityContext: lineItem.packageSize,
          availabilityStatus: 'available',
          confidenceScore: lineItem.matchConfidence,
          sourceReceiptLineItemId: lineItem.id,
          observedAt: record.purchaseDate || record.createdAt,
        }),
      ),
    );
  }
}
