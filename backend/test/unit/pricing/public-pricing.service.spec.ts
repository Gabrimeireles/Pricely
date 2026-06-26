import { Logger, NotFoundException } from '@nestjs/common';

import { PublicPricingService } from '../../../src/pricing/application/public-pricing.service';

describe('PublicPricingService', () => {
  it('projects regional offers and product detail from active data only', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      region: {
        findUnique: jest.fn().mockResolvedValueOnce({
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
          implantationStatus: 'active',
        }),
      },
      establishment: {
        count: jest.fn().mockResolvedValue(1),
      },
      productOffer: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'offer-1',
              catalogProductId: 'product-1',
              productVariantId: 'variant-1',
              displayName: 'Cafe 500g',
              packageLabel: '500 g',
              priceAmount: 15.9,
              basePriceAmount: 18.9,
              promotionalPriceAmount: 15.9,
              sourceType: 'admin',
              sourceReference: 'Painel admin',
              observedAt: new Date('2026-04-27T10:00:00Z'),
              confidenceLevel: 'high',
              catalogProduct: {
                name: 'Cafe torrado',
                category: 'mercearia',
                imageUrl: null,
              },
              productVariant: {
                displayName: 'Cafe 500g',
                imageUrl: 'https://example.com/cafe.png',
              },
              establishment: {
                unitName: 'Mercado Centro',
                neighborhood: 'Centro',
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'offer-1',
              packageLabel: '500 g',
              priceAmount: 15.9,
              basePriceAmount: 18.9,
              promotionalPriceAmount: 15.9,
              sourceType: 'admin',
              sourceReference: 'Painel admin',
              observedAt: new Date('2026-04-27T10:00:00Z'),
              confidenceLevel: 'high',
              establishment: {
                unitName: 'Mercado Centro',
                neighborhood: 'Centro',
              },
            },
          ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'offer-1',
          isActive: true,
          catalogProductId: 'product-1',
          productVariantId: 'variant-1',
          displayName: 'Cafe 500g',
          packageLabel: '500 g',
          priceAmount: 15.9,
          basePriceAmount: 18.9,
          promotionalPriceAmount: 15.9,
          sourceType: 'admin',
          sourceReference: 'Painel admin',
          observedAt: new Date('2026-04-27T10:00:00Z'),
          confidenceLevel: 'high',
          catalogProduct: {
            id: 'product-1',
            name: 'Cafe torrado',
            category: 'mercearia',
            imageUrl: null,
          },
          productVariant: {
            id: 'variant-1',
            displayName: 'Cafe 500g',
            brandName: 'Pilao',
            packageLabel: '500 g',
            imageUrl: 'https://example.com/cafe.png',
          },
          establishment: {
            isActive: true,
            regionId: 'region-1',
            unitName: 'Mercado Centro',
            neighborhood: 'Centro',
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

    const service = new PublicPricingService(prisma as never);

    await expect(service.listRegionOffers('sao-paulo-sp')).resolves.toEqual({
      region: {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
      },
      activeEstablishmentCount: 1,
      offerCoverageStatus: 'live',
      offers: [
        expect.objectContaining({
          id: 'offer-1',
          productName: 'Cafe torrado',
          category: 'mercearia',
          variantName: 'Cafe 500g',
          imageUrl: 'https://example.com/cafe.png',
          storeName: 'Mercado Centro',
          priceAmount: 15.9,
          basePriceAmount: 18.9,
          promotionalPriceAmount: 15.9,
        }),
      ],
      groupedOffers: [
        expect.objectContaining({
          id: 'variant-1',
          productVariantId: 'variant-1',
          productName: 'Cafe torrado',
          category: 'mercearia',
          variantName: 'Cafe 500g',
          establishmentCount: 1,
          cheapestPriceAmount: 15.9,
          averagePriceAmount: 15.9,
          highestPriceAmount: 15.9,
          bestOffer: expect.objectContaining({
            id: 'offer-1',
            category: 'mercearia',
            storeName: 'Mercado Centro',
          }),
          alternativeOffers: [],
          offers: [
            expect.objectContaining({
              id: 'offer-1',
              storeName: 'Mercado Centro',
            }),
          ],
        }),
      ],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      filters: {
        stores: ['Mercado Centro'],
        categories: ['mercearia'],
      },
    });

    await expect(service.getOfferDetail('offer-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'offer-1',
        product: expect.objectContaining({
          id: 'product-1',
          imageUrl: 'https://example.com/cafe.png',
        }),
        variant: expect.objectContaining({
          id: 'variant-1',
          brandName: 'Pilao',
        }),
        activeOffer: expect.objectContaining({
          basePriceAmount: 18.9,
          promotionalPriceAmount: 15.9,
          regionalAveragePriceAmount: 15.9,
          comparisonPriceAmount: 15.9,
          savingsVsComparison: 0,
        }),
        alternativeOffers: [
          expect.objectContaining({
            id: 'offer-1',
            storeName: 'Mercado Centro',
            basePriceAmount: 18.9,
            promotionalPriceAmount: 15.9,
          }),
        ],
      }),
    );

    expect(logSpy).toHaveBeenCalledWith(
      'Public offers requested for sao-paulo-sp: 1 offers, 1 active establishments',
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Offer detail requested for offer-1: 1 regional alternatives',
    );
  });

  it('compares only identical variants across establishments in the same region', async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      productOffer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'offer-cheap',
          isActive: true,
          catalogProductId: 'product-arroz',
          productVariantId: 'variant-camil',
          displayName: 'Arroz Camil 5kg',
          packageLabel: '5 kg',
          priceAmount: 19.99,
          basePriceAmount: 20.99,
          promotionalPriceAmount: 19.99,
          sourceType: 'receipt',
          sourceReference: 'NFCe 2',
          observedAt: new Date('2026-04-27T10:00:00Z'),
          confidenceLevel: 'high',
          catalogProduct: {
            id: 'product-arroz',
            name: 'Arroz tipo 1 5kg',
            category: 'mercearia',
            imageUrl: null,
          },
          productVariant: {
            id: 'variant-camil',
            displayName: 'Arroz Camil 5kg',
            brandName: 'Camil',
            packageLabel: '5 kg',
            imageUrl: null,
          },
          establishment: {
            isActive: true,
            regionId: 'region-1',
            unitName: 'Estabelecimento 2',
            neighborhood: 'Pinheiros',
            region: {
              id: 'region-1',
              slug: 'sao-paulo-sp',
              name: 'Sao Paulo',
              stateCode: 'SP',
            },
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'offer-cheap',
            packageLabel: '5 kg',
            priceAmount: 19.99,
            basePriceAmount: 20.99,
            promotionalPriceAmount: 19.99,
            sourceType: 'receipt',
            sourceReference: 'NFCe 2',
            observedAt: new Date('2026-04-27T10:00:00Z'),
            confidenceLevel: 'high',
            establishment: {
              unitName: 'Estabelecimento 2',
              neighborhood: 'Pinheiros',
            },
          },
          {
            id: 'offer-expensive',
            packageLabel: '5 kg',
            priceAmount: 20.99,
            basePriceAmount: 20.99,
            promotionalPriceAmount: null,
            sourceType: 'receipt',
            sourceReference: 'NFCe 1',
            observedAt: new Date('2026-04-27T09:00:00Z'),
            confidenceLevel: 'high',
            establishment: {
              unitName: 'Estabelecimento 1',
              neighborhood: 'Centro',
            },
          },
        ]),
      },
    };

    const service = new PublicPricingService(prisma as never);

    await expect(service.getOfferDetail('offer-cheap')).resolves.toEqual(
      expect.objectContaining({
        activeOffer: expect.objectContaining({
          priceAmount: 19.99,
          comparisonPriceAmount: 20.99,
          savingsVsComparison: 1,
        }),
        alternativeOffers: expect.arrayContaining([
          expect.objectContaining({
            id: 'offer-expensive',
            priceAmount: 20.99,
          }),
        ]),
      }),
    );

    expect(prisma.productOffer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productVariantId: 'variant-camil',
        }),
      }),
    );
  });

  it('filters, sorts, and paginates regional offer groups', async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const makeOffer = (
      id: string,
      variantName: string,
      priceAmount: number,
      category: string,
    ) => ({
      id,
      catalogProductId: `product-${id}`,
      productVariantId: `variant-${id}`,
      displayName: variantName,
      packageLabel: '1 un',
      priceAmount,
      basePriceAmount: priceAmount,
      promotionalPriceAmount: null,
      sourceType: 'admin',
      sourceReference: 'Teste',
      observedAt: new Date('2026-06-24T10:00:00Z'),
      confidenceLevel: 'high' as const,
      catalogProduct: {
        name: variantName,
        category,
        imageUrl: null,
      },
      productVariant: {
        displayName: variantName,
        imageUrl: null,
      },
      establishment: {
        unitName: 'Mercado Centro',
        neighborhood: 'Centro',
      },
    });
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'offer-cafe' }])
      .mockResolvedValueOnce([
        makeOffer('cafe', 'Cafe 500g', 16.9, 'mercearia'),
        makeOffer('acucar', 'Acucar 1kg', 4.19, 'mercearia'),
        makeOffer('arroz', 'Arroz 5kg', 20.9, 'mercearia'),
      ]);
    const prisma = {
      region: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
          implantationStatus: 'active',
        }),
      },
      establishment: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([{ id: 'store-1' }]),
      },
      catalogProduct: {
        findMany: jest.fn().mockResolvedValue([{ id: 'product-cafe' }]),
      },
      productVariant: {
        findMany: jest.fn().mockResolvedValue([{ id: 'variant-cafe' }]),
      },
      productOffer: {
        findMany,
      },
    };
    const searchMetrics = {
      record: jest.fn().mockResolvedValue({
        p95Ms: 120,
        p95TargetMs: 750,
        pgTrgmEvaluation: { recommended: false },
      }),
    };
    const service = new PublicPricingService(
      prisma as never,
      searchMetrics as never,
    );

    const result = await service.listRegionOffers('sao-paulo-sp', {
      query: 'a',
      store: 'Mercado Centro',
      category: 'mercearia',
      confidence: 'high',
      sort: 'lowest-price',
      page: '2',
      pageSize: '1',
    });

    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 1,
      totalItems: 3,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true,
    });
    expect(result.groupedOffers).toHaveLength(1);
    expect(result.groupedOffers[0].variantName).toBe('Cafe 500g');
    expect(result.offers).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          confidenceLevel: 'high',
          OR: [
            { id: { in: ['offer-cafe'] } },
            { catalogProductId: { in: ['product-cafe'] } },
            { productVariantId: { in: ['variant-cafe'] } },
            { establishmentId: { in: ['store-1'] } },
          ],
          catalogProduct: expect.objectContaining({
            category: expect.objectContaining({
              equals: 'mercearia',
            }),
          }),
          establishment: expect.objectContaining({
            unitName: expect.objectContaining({
              equals: 'Mercado Centro',
            }),
          }),
        }),
      }),
    );
    expect(searchMetrics.record).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: 'candidate',
        resultCount: 3,
        regionSlug: 'sao-paulo-sp',
        candidateCounts: {
          offers: 1,
          products: 1,
          variants: 1,
          establishments: 1,
        },
      }),
    );
  });

  it('falls back to the broad relational search for high-cardinality terms', async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const candidateLimit = 5_001;
    const broadCandidates = Array.from(
      { length: candidateLimit },
      (_, index) => ({
        id: `offer-${index}`,
      }),
    );
    const finalFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      region: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
          implantationStatus: 'active',
        }),
      },
      establishment: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
      },
      catalogProduct: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      productVariant: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      productOffer: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(broadCandidates)
          .mockImplementationOnce(finalFindMany),
      },
    };
    const service = new PublicPricingService(prisma as never);

    await service.listRegionOffers('sao-paulo-sp', { query: 'produto' });

    expect(finalFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              displayName: {
                contains: 'produto',
                mode: 'insensitive',
              },
            },
            {
              catalogProduct: {
                name: {
                  contains: 'produto',
                  mode: 'insensitive',
                },
              },
            },
          ]),
        }),
      }),
    );
  });

  it('throws not found for inactive or missing regions', async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      region: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'region-1',
          slug: 'inactive-region',
          implantationStatus: 'inactive',
        }),
      },
    };

    const service = new PublicPricingService(prisma as never);

    await expect(service.listRegionOffers('inactive-region')).rejects.toThrow(
      NotFoundException,
    );
  });
});
