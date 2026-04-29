import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CatalogModule } from '../../../src/catalog/catalog.module';
import { HttpExceptionFilter } from '../../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../../src/common/validation/validation.pipe';
import { PrismaService } from '../../../src/persistence/prisma.service';

describe('Public catalog integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaMock = {
      catalogProduct: {
        findMany: async () => [
          {
            id: 'product-1',
            slug: 'arroz-tipo-1-1kg',
            name: 'Arroz tipo 1 1kg',
            category: 'mercearia',
            defaultUnit: '1 kg',
            imageUrl: 'https://cdn.pricely.local/arroz.png',
            isActive: true,
            productVariants: [
              {
                id: 'variant-1',
                catalogProductId: 'product-1',
                slug: 'arroz-camil-1kg',
                displayName: 'Arroz Camil 1kg',
                brandName: 'Camil',
                variantLabel: 'Tipo 1',
                packageLabel: '1 kg',
                imageUrl: 'https://cdn.pricely.local/arroz-camil.png',
                isActive: true,
              },
            ],
          },
        ],
        findUnique: async ({ where }: { where: { id: string } }) =>
          where.id === 'product-1'
            ? {
                id: 'product-1',
                slug: 'arroz-tipo-1-1kg',
                name: 'Arroz tipo 1 1kg',
                category: 'mercearia',
                defaultUnit: '1 kg',
                imageUrl: 'https://cdn.pricely.local/arroz.png',
                isActive: true,
                productVariants: [
                  {
                    id: 'variant-1',
                    catalogProductId: 'product-1',
                    slug: 'arroz-camil-1kg',
                    displayName: 'Arroz Camil 1kg',
                    brandName: 'Camil',
                    variantLabel: 'Tipo 1',
                    packageLabel: '1 kg',
                    imageUrl: 'https://cdn.pricely.local/arroz-camil.png',
                    isActive: true,
                  },
                ],
              }
            : null,
      },
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            catalogProductId: 'product-1',
            slug: 'arroz-camil-1kg',
            displayName: 'Arroz Camil 1kg',
            brandName: 'Camil',
            variantLabel: 'Tipo 1',
            packageLabel: '1 kg',
            imageUrl: 'https://cdn.pricely.local/arroz-camil.png',
            isActive: true,
          },
        ],
      },
      productOffer: {
        findMany: async () => [
          {
            id: 'offer-1',
            catalogProductId: 'product-1',
            productVariantId: 'variant-1',
            displayName: 'Arroz Camil 1kg',
            packageLabel: '1 kg',
            priceAmount: 7.99,
            observedAt: new Date('2026-04-27T10:00:00Z'),
            confidenceLevel: 'high',
            establishment: {
              unitName: 'Mercado Centro',
              neighborhood: 'Centro',
              region: {
                id: 'region-1',
                slug: 'campinas-sp',
                name: 'Campinas',
                stateCode: 'SP',
              },
            },
          },
        ],
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CatalogModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns base-product search results, variants, and product detail', async () => {
    const searchResponse = await request(app.getHttpServer())
      .get('/catalog-products/search?q=arroz')
      .expect(200);

    expect(searchResponse.body).toEqual([
      expect.objectContaining({
        id: 'product-1',
        name: 'Arroz tipo 1 1kg',
        productVariants: [
          expect.objectContaining({
            id: 'variant-1',
            brandName: 'Camil',
          }),
        ],
      }),
    ]);

    const variantsResponse = await request(app.getHttpServer())
      .get('/catalog-products/product-1/variants')
      .expect(200);

    expect(variantsResponse.body).toEqual([
      expect.objectContaining({
        id: 'variant-1',
        catalogProductId: 'product-1',
        displayName: 'Arroz Camil 1kg',
      }),
    ]);

    const detailResponse = await request(app.getHttpServer())
      .get('/catalog-products/product-1')
      .expect(200);

    expect(detailResponse.body).toEqual(
      expect.objectContaining({
        catalogProduct: expect.objectContaining({
          id: 'product-1',
          name: 'Arroz tipo 1 1kg',
        }),
        variants: expect.any(Array),
        offers: [
          expect.objectContaining({
            id: 'offer-1',
            storeName: 'Mercado Centro',
            priceAmount: 7.99,
          }),
        ],
      }),
    );
  });
});
