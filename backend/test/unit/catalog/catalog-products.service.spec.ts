import { CatalogProductsService } from '../../../src/catalog/application/catalog-products.service';

describe('CatalogProductsService', () => {
  it('creates a catalog product with an optional admin alias', async () => {
    const prisma = {
      catalogProduct: {
        create: jest.fn().mockResolvedValue({
          id: 'product-1',
          slug: 'arroz-tipo-1-1kg',
          name: 'Arroz tipo 1 1kg',
          category: 'mercearia',
          defaultUnit: '1 kg',
          imageUrl: 'https://cdn.pricely.local/arroz.png',
          isActive: true,
          aliases: [
            {
              id: 'alias-1',
              alias: 'arroz 1kg',
            },
          ],
        }),
      },
    };

    const service = new CatalogProductsService(prisma as never);

    await expect(
      service.createProduct({
        slug: 'arroz-tipo-1-1kg',
        name: 'Arroz tipo 1 1kg',
        category: 'mercearia',
        defaultUnit: '1 kg',
        imageUrl: 'https://cdn.pricely.local/arroz.png',
        alias: 'arroz 1kg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        slug: 'arroz-tipo-1-1kg',
        aliases: [
          expect.objectContaining({
            alias: 'arroz 1kg',
          }),
        ],
      }),
    );

    expect(prisma.catalogProduct.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        aliases: {
          create: expect.objectContaining({
            alias: 'arroz 1kg',
            sourceType: 'admin',
            confidenceScore: 1,
          }),
        },
      }),
      include: {
        aliases: true,
      },
    });
  });

  it('lists active variants ordered by brand and display name', async () => {
    const prisma = {
      productVariant: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'variant-1',
            catalogProductId: 'product-1',
            displayName: 'Arroz Camil 1kg',
            brandName: 'Camil',
            isActive: true,
          },
        ]),
      },
    };

    const service = new CatalogProductsService(prisma as never);

    await expect(service.listVariants('product-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'variant-1',
        brandName: 'Camil',
      }),
    ]);
    expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
      where: {
        catalogProductId: 'product-1',
      },
      orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
    });
  });

  it('soft deletes a catalog product with its active variants and offers', async () => {
    const prisma = {
      catalogProduct: {
        update: jest.fn().mockResolvedValue({
          id: 'product-1',
          isActive: false,
        }),
      },
      productVariant: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      productOffer: {
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };

    const service = new CatalogProductsService(prisma as never);

    await expect(service.deleteProduct('product-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'product-1',
        isActive: false,
      }),
    );

    expect(prisma.catalogProduct.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { isActive: false },
      include: {
        aliases: true,
      },
    });
    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
      where: {
        catalogProductId: 'product-1',
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    expect(prisma.productOffer.updateMany).toHaveBeenCalledWith({
      where: {
        catalogProductId: 'product-1',
        isActive: true,
      },
      data: {
        availabilityStatus: 'unavailable',
        isActive: false,
      },
    });
  });

  it('soft deletes a product variant and removes its active offers from circulation', async () => {
    const prisma = {
      productVariant: {
        update: jest.fn().mockResolvedValue({
          id: 'variant-1',
          isActive: false,
        }),
      },
      productOffer: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };

    const service = new CatalogProductsService(prisma as never);

    await expect(service.deleteVariant('variant-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'variant-1',
        isActive: false,
      }),
    );

    expect(prisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { isActive: false },
    });
    expect(prisma.productOffer.updateMany).toHaveBeenCalledWith({
      where: {
        productVariantId: 'variant-1',
        isActive: true,
      },
      data: {
        availabilityStatus: 'unavailable',
        isActive: false,
      },
    });
  });
});
