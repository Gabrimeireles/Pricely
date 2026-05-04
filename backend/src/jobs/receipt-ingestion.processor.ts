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

    await this.persistStoreOffers(record);
    this.logger.log(`Receipt ${receiptRecordId} processed into store offers`);
  }

  private async persistStoreOffers(record: ReceiptRecordEntity): Promise<void> {
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
