import { Injectable } from '@nestjs/common';

import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';
import { ReceiptRecordRepository } from '../infrastructure/receipt-record.repository';

export interface ReceiptContributionAssessment {
  duplicateKey: string;
  trustLevel: 'untrusted' | 'pending_review' | 'trusted' | 'rejected';
  moderationStatus:
    | 'pending'
    | 'accepted'
    | 'quarantined'
    | 'duplicate'
    | 'rejected';
  rewardEligibilityStatus:
    | 'disabled'
    | 'ineligible'
    | 'eligible_pending'
    | 'granted';
  reviewReason?: string;
  logs: string[];
}

@Injectable()
export class ReceiptContributionQualityService {
  constructor(
    private readonly receiptRecordRepository: ReceiptRecordRepository,
  ) {}

  async assess(
    record: ReceiptRecordEntity,
  ): Promise<ReceiptContributionAssessment> {
    const duplicateKey = this.buildDuplicateKey(record);
    const duplicate = await this.receiptRecordRepository.findDuplicateCandidate(
      duplicateKey,
      record.userId,
    );

    if (duplicate) {
      return {
        duplicateKey,
        trustLevel: 'rejected',
        moderationStatus: 'duplicate',
        rewardEligibilityStatus: 'ineligible',
        reviewReason: 'duplicate_receipt',
        logs: [
          'quality:duplicate_receipt',
          `quality:duplicate_of:${duplicate.id}`,
        ],
      };
    }

    if (record.parseStatus === 'failed' || record.lineItems.length === 0) {
      return {
        duplicateKey,
        trustLevel: 'rejected',
        moderationStatus: 'rejected',
        rewardEligibilityStatus: 'ineligible',
        reviewReason: 'receipt_parse_failed',
        logs: ['quality:receipt_parse_failed'],
      };
    }

    if (this.hasSuspiciousPrice(record)) {
      return {
        duplicateKey,
        trustLevel: 'pending_review',
        moderationStatus: 'quarantined',
        rewardEligibilityStatus: 'disabled',
        reviewReason: 'suspicious_price',
        logs: ['quality:suspicious_price', 'reward:disabled_until_review'],
      };
    }

    if (this.hasLowConfidence(record)) {
      return {
        duplicateKey,
        trustLevel: 'pending_review',
        moderationStatus: 'quarantined',
        rewardEligibilityStatus: 'disabled',
        reviewReason: 'low_confidence_extraction',
        logs: [
          'quality:low_confidence_extraction',
          'reward:disabled_until_review',
        ],
      };
    }

    return {
      duplicateKey,
      trustLevel: 'trusted',
      moderationStatus: 'accepted',
      rewardEligibilityStatus: 'eligible_pending',
      reviewReason: 'receipt_reward_ready',
      logs: [
        'quality:trusted_receipt',
        'reward:points_pending:100',
        'reward:optimization_token_pending:1',
      ],
    };
  }

  buildDuplicateKey(record: ReceiptRecordEntity): string {
    if (record.accessKey) {
      return `access-key:${record.accessKey}`;
    }

    const itemFingerprint = record.lineItems
      .map(
        (item) =>
          `${item.ean ?? item.normalizedName}:${item.quantity}:${item.unitPrice}`,
      )
      .sort()
      .join('|');

    return [
      'fallback',
      record.userId,
      record.storeCnpj ?? record.storeName ?? 'unknown-store',
      record.purchaseDate ?? 'unknown-date',
      itemFingerprint,
    ].join(':');
  }

  private hasLowConfidence(record: ReceiptRecordEntity): boolean {
    return (
      record.confidenceScore < 0.75 ||
      record.lineItems.some((item) => item.matchConfidence < 0.75)
    );
  }

  private hasSuspiciousPrice(record: ReceiptRecordEntity): boolean {
    return record.lineItems.some((item) => {
      const discountRatio =
        item.originalUnitPrice && item.originalUnitPrice > 0
          ? item.unitPrice / item.originalUnitPrice
          : 1;

      return (
        item.unitPrice <= 0 || item.unitPrice > 10000 || discountRatio < 0.5
      );
    });
  }
}
