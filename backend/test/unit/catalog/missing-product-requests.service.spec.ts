import { MissingProductRequestsService } from '../../../src/catalog/application/missing-product-requests.service';

describe('MissingProductRequestsService', () => {
  it('creates a normalized shopper request', async () => {
    const prisma = {
      missingProductRequest: {
        create: jest.fn().mockResolvedValue({ id: 'request-1' }),
      },
    } as any;
    const service = new MissingProductRequestsService(prisma);

    await service.create('user-1', {
      requestedName: '  Leite sem lactose  ',
      categoryHint: ' Laticinios ',
    });

    expect(prisma.missingProductRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        requestedName: 'Leite sem lactose',
        categoryHint: 'Laticinios',
      }),
    });
  });

  it('converts a request into a catalog product transactionally', async () => {
    const transaction = {
      catalogProduct: {
        create: jest.fn().mockResolvedValue({
          id: 'product-1',
          name: 'Leite sem lactose',
        }),
      },
      missingProductRequest: {
        update: jest.fn(),
      },
    };
    const prisma = {
      missingProductRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: '12345678-1234-1234-1234-123456789012',
          requestedName: 'Leite sem lactose',
          packageHint: '1 L',
          status: 'requested',
        }),
      },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    } as any;
    const service = new MissingProductRequestsService(prisma);

    await service.convert('12345678-1234-1234-1234-123456789012', 'admin-1', {
      category: 'Laticinios',
    });

    expect(transaction.catalogProduct.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Leite sem lactose',
        category: 'Laticinios',
        defaultUnit: '1 L',
      }),
    });
    expect(transaction.missingProductRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'converted',
          catalogProductId: 'product-1',
          reviewedByUserId: 'admin-1',
        }),
      }),
    );
  });
});
