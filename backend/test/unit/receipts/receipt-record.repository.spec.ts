import { ReceiptRecordRepository } from '../../../src/receipts/infrastructure/receipt-record.repository';
import { type ReceiptRecordEntity } from '../../../src/receipts/domain/receipt-record.entity';

function buildReceiptRecord(
  overrides: Partial<ReceiptRecordEntity> = {},
): ReceiptRecordEntity {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    storeName: 'SUPERMERCADO TESTE LTDA',
    storeCnpj: '04641376024400',
    storeAddressLine: 'AV. LEITE DE CASTRO, 261',
    storeNeighborhood: 'FABRICAS',
    storePostalCode: '3162500',
    storeCityName: 'SAO JOAO DEL REI',
    storeStateCode: 'MG',
    sourceType: 'qr_code_url',
    parseStatus: 'parsed',
    confidenceScore: 0.95,
    trustLevel: 'trusted',
    moderationStatus: 'accepted',
    rewardEligibilityStatus: 'eligible_pending',
    processingLogs: ['receipt_received'],
    lineItems: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        receiptRecordId: '11111111-1111-4111-8111-111111111111',
        rawProductName: 'CAFE PILAO TRAD 500G',
        normalizedName: 'cafe pilao trad 500g',
        quantity: 1,
        unitPrice: 25.8,
        originalUnitPrice: 25.8,
        currency: 'BRL',
        matchConfidence: 0.9,
      },
    ],
    createdAt: '2026-05-15T23:36:48.000Z',
    updatedAt: '2026-05-15T23:36:48.000Z',
    ...overrides,
  };
}

describe('ReceiptRecordRepository', () => {
  it('creates an inactive establishment candidate for a new NFC-e store in an existing region', async () => {
    const createdEstablishment = {
      id: '44444444-4444-4444-8444-444444444444',
      brandName: 'SUPERMERCADO TESTE LTDA',
      unitName: 'SUPERMERCADO TESTE LTDA',
      cnpj: '04.641.376/0244-00',
      cityName: 'Sao Joao Del Rei',
      neighborhood: 'FABRICAS',
      regionId: '55555555-5555-4555-8555-555555555555',
      isActive: false,
    };
    const prisma = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdEstablishment),
      },
      region: {
        findFirst: jest.fn().mockResolvedValue({
          id: '55555555-5555-4555-8555-555555555555',
          name: 'Sao Joao Del Rei',
        }),
      },
      receiptRecord: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const repository = new ReceiptRecordRepository(prisma as never);

    const stored = await repository.create(buildReceiptRecord());

    expect(prisma.region.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { slug: 'sao-joao-del-rei-mg' },
          { name: 'SAO JOAO DEL REI', stateCode: 'MG' },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
    expect(prisma.establishment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        brandName: 'SUPERMERCADO TESTE LTDA',
        unitName: 'SUPERMERCADO TESTE LTDA',
        cnpj: '04.641.376/0244-00',
        cityName: 'Sao Joao Del Rei',
        neighborhood: 'FABRICAS',
        addressLine: 'AV. LEITE DE CASTRO, 261',
        postalCode: '3162500',
        locationSource: 'receipt_candidate',
        regionId: '55555555-5555-4555-8555-555555555555',
        isActive: false,
      }),
    });
    expect(prisma.receiptRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        establishmentId: '44444444-4444-4444-8444-444444444444',
      }),
    });
    expect(stored).toMatchObject({
      storeId: '44444444-4444-4444-8444-444444444444',
      processingLogs: [
        'receipt_received',
        'store_candidate_linked:44444444-4444-4444-8444-444444444444',
      ],
    });
  });

  it('does not create a city or establishment when the NFC-e city is not administered yet', async () => {
    const prisma = {
      establishment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      region: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      receiptRecord: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const repository = new ReceiptRecordRepository(prisma as never);

    const stored = await repository.create(buildReceiptRecord());

    expect(prisma.establishment.create).not.toHaveBeenCalled();
    expect(prisma.receiptRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        establishmentId: null,
      }),
    });
    expect(stored.storeId).toBeUndefined();
  });
});
