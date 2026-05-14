import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { HttpExceptionFilter } from '../../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../../src/common/validation/validation.pipe';
import { PrismaService } from '../../../src/persistence/prisma.service';
import { PricingModule } from '../../../src/pricing/pricing.module';
import { RegionsModule } from '../../../src/regions/regions.module';

describe('Public regions and pricing integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaMock = {
      region: {
        findMany: async () => [
          {
            id: 'region-1',
            slug: 'sao-paulo-sp',
            name: 'Sao Paulo',
            stateCode: 'SP',
            implantationStatus: 'active',
            establishments: [
              {
                id: 'est-1',
                brandName: 'Mercado',
                unitName: 'Mercado Centro',
                neighborhood: 'Centro',
                cityName: 'Sao Paulo',
                productOffers: [{ id: 'offer-1' }],
              },
            ],
          },
          {
            id: 'region-2',
            slug: 'campinas-sp',
            name: 'Campinas',
            stateCode: 'SP',
            implantationStatus: 'activating',
            establishments: [],
          },
        ],
        findUnique: async ({ where }: { where: { slug: string } }) =>
          where.slug === 'sao-paulo-sp'
            ? {
                id: 'region-1',
                slug: 'sao-paulo-sp',
                name: 'Sao Paulo',
                stateCode: 'SP',
                implantationStatus: 'active',
              }
            : null,
      },
      establishment: {
        count: async () => 1,
      },
      cityInclusionRequest: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'request-1',
          status: 'requested',
          createdAt: new Date('2026-05-10T10:00:00Z'),
          updatedAt: new Date('2026-05-10T10:00:00Z'),
          ...data,
        }),
      },
      productOffer: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          if (where.catalogProductId) {
            return [
              {
                id: 'offer-1',
                packageLabel: '500 g',
                priceAmount: 15.9,
                sourceType: 'admin',
                sourceReference: 'Painel admin',
                observedAt: new Date('2026-04-26T10:00:00Z'),
                confidenceLevel: 'high',
                productVariant: {
                  id: 'variant-1',
                  displayName: 'Cafe torrado 500g',
                  brandName: 'Pilao',
                  imageUrl: null,
                },
                establishment: {
                  unitName: 'Mercado Centro',
                  neighborhood: 'Centro',
                },
              },
            ];
          }

          return [
            {
              id: 'offer-1',
              catalogProductId: 'product-1',
              productVariantId: 'variant-1',
              displayName: 'Cafe torrado 500g',
              packageLabel: '500 g',
              priceAmount: 15.9,
              sourceType: 'admin',
              sourceReference: 'Painel admin',
              observedAt: new Date('2026-04-26T10:00:00Z'),
              confidenceLevel: 'high',
              catalogProduct: {
                id: 'product-1',
                name: 'Cafe torrado',
                category: 'mercearia',
                imageUrl: null,
              },
              productVariant: {
                id: 'variant-1',
                displayName: 'Cafe torrado 500g',
                brandName: 'Pilao',
                imageUrl: null,
              },
              establishment: {
                id: 'est-1',
                unitName: 'Mercado Centro',
                neighborhood: 'Centro',
              },
            },
          ];
        },
        findUnique: async () => ({
          id: 'offer-1',
          catalogProductId: 'product-1',
          productVariantId: 'variant-1',
          isActive: true,
          displayName: 'Cafe torrado 500g',
          packageLabel: '500 g',
          priceAmount: 15.9,
          sourceType: 'admin',
          sourceReference: 'Painel admin',
          observedAt: new Date('2026-04-26T10:00:00Z'),
          confidenceLevel: 'high',
          catalogProduct: {
            id: 'product-1',
            name: 'Cafe torrado',
            category: 'mercearia',
            imageUrl: null,
          },
          productVariant: {
            id: 'variant-1',
            displayName: 'Cafe torrado 500g',
            brandName: 'Pilao',
            packageLabel: '500 g',
            imageUrl: null,
          },
          establishment: {
            id: 'est-1',
            unitName: 'Mercado Centro',
            neighborhood: 'Centro',
            isActive: true,
            regionId: 'region-1',
            region: {
              id: 'region-1',
              slug: 'sao-paulo-sp',
              name: 'Sao Paulo',
              stateCode: 'SP',
            },
          },
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [RegionsModule, PricingModule],
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

  it('lists visible regions and excludes inactive ones', async () => {
    const response = await request(app.getHttpServer())
      .get('/regions')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        slug: 'sao-paulo-sp',
        activeEstablishmentCount: 1,
        offerCoverageStatus: 'live',
        establishments: [
          expect.objectContaining({
            unitName: 'Mercado Centro',
            neighborhood: 'Centro',
            offerCount: 1,
          }),
        ],
      }),
      expect.objectContaining({
        slug: 'campinas-sp',
        activeEstablishmentCount: 0,
        offerCoverageStatus: 'collecting_data',
      }),
    ]);
  });

  it('returns region offers and offer detail', async () => {
    const offersResponse = await request(app.getHttpServer())
      .get('/regions/sao-paulo-sp/offers')
      .expect(200);

    expect(offersResponse.body.offers[0]).toEqual(
      expect.objectContaining({
        id: 'offer-1',
        catalogProductId: 'product-1',
        productName: 'Cafe torrado',
      }),
    );

    const detailResponse = await request(app.getHttpServer())
      .get('/offers/offer-1')
      .expect(200);

    expect(detailResponse.body).toEqual(
      expect.objectContaining({
        id: 'offer-1',
        product: expect.objectContaining({
          id: 'product-1',
        }),
        variant: expect.objectContaining({
          id: 'variant-1',
        }),
        alternativeOffers: expect.any(Array),
      }),
    );
  });

  it('accepts public city inclusion requests without creating a region', async () => {
    const response = await request(app.getHttpServer())
      .post('/regions/requests')
      .send({
        cityName: 'Santos',
        stateCode: 'sp',
        contactEmail: 'cliente@pricely.local',
        message: 'Priorizar mercados da orla',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'request-1',
        cityName: 'Santos',
        stateCode: 'SP',
        status: 'requested',
      }),
    );
  });
});
