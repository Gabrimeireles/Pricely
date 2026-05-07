import { ReceiptContributionQualityService } from '../../../src/receipts/application/receipt-contribution-quality.service';
import { type ReceiptRecordEntity } from '../../../src/receipts/domain/receipt-record.entity';

function createReceipt(
  overrides: Partial<ReceiptRecordEntity> = {},
): ReceiptRecordEntity {
  return {
    id: 'receipt-1',
    userId: 'user-1',
    storeName: 'Mercado Centro',
    storeCnpj: '12345678000190',
    accessKey: '12345678901234567890123456789012345678901234',
    purchaseDate: '2026-05-06T10:00:00.000Z',
    sourceType: 'manual_entry',
    parseStatus: 'parsed',
    confidenceScore: 0.95,
    processingLogs: [],
    lineItems: [
      {
        id: 'line-1',
        receiptRecordId: 'receipt-1',
        ean: '7891000000000',
        rawProductName: 'Cafe torrado 500g',
        normalizedName: 'cafe torrado',
        quantity: 1,
        unitPrice: 15.9,
        currency: 'BRL',
        matchConfidence: 0.95,
      },
    ],
    createdAt: '2026-05-06T10:00:00.000Z',
    updatedAt: '2026-05-06T10:00:00.000Z',
    ...overrides,
  };
}

describe('ReceiptContributionQualityService', () => {
  it('accepts trusted non-duplicated receipts but keeps rewards disabled for MVP', async () => {
    const service = new ReceiptContributionQualityService({
      findDuplicateCandidate: jest.fn().mockResolvedValue(null),
    } as never);

    const result = await service.assess(createReceipt());

    expect(result).toMatchObject({
      duplicateKey: 'access-key:12345678901234567890123456789012345678901234',
      trustLevel: 'trusted',
      moderationStatus: 'accepted',
      rewardEligibilityStatus: 'disabled',
      reviewReason: 'receipt_rewards_disabled',
    });
  });

  it('rejects duplicate receipts before reward eligibility', async () => {
    const service = new ReceiptContributionQualityService({
      findDuplicateCandidate: jest
        .fn()
        .mockResolvedValue({ id: 'receipt-existing' }),
    } as never);

    const result = await service.assess(createReceipt());

    expect(result).toMatchObject({
      trustLevel: 'rejected',
      moderationStatus: 'duplicate',
      rewardEligibilityStatus: 'ineligible',
      reviewReason: 'duplicate_receipt',
    });
  });

  it('quarantines suspicious discounts for manual review', async () => {
    const service = new ReceiptContributionQualityService({
      findDuplicateCandidate: jest.fn().mockResolvedValue(null),
    } as never);
    const base = createReceipt();

    const result = await service.assess(
      createReceipt({
        lineItems: [
          {
            ...base.lineItems[0],
            unitPrice: 4,
            originalUnitPrice: 20,
          },
        ],
      }),
    );

    expect(result).toMatchObject({
      trustLevel: 'pending_review',
      moderationStatus: 'quarantined',
      rewardEligibilityStatus: 'disabled',
      reviewReason: 'suspicious_price',
    });
  });

  it('quarantines low-confidence OCR or product matching', async () => {
    const service = new ReceiptContributionQualityService({
      findDuplicateCandidate: jest.fn().mockResolvedValue(null),
    } as never);

    const result = await service.assess(
      createReceipt({ confidenceScore: 0.7 }),
    );

    expect(result).toMatchObject({
      trustLevel: 'pending_review',
      moderationStatus: 'quarantined',
      reviewReason: 'low_confidence_extraction',
    });
  });
});
