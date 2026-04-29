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
});
