import { Logger, NotFoundException } from '@nestjs/common';

import { PublicPricingService } from '../../../src/pricing/application/public-pricing.service';

describe('PublicPricingService', () => {
  it('projects regional offers and product detail from active data only', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      region: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
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
              sourceType: 'admin',
              sourceReference: 'Painel admin',
              observedAt: new Date('2026-04-27T10:00:00Z'),
              confidenceLevel: 'high',
              catalogProduct: {
                name: 'Cafe torrado',
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
          variantName: 'Cafe 500g',
          imageUrl: 'https://example.com/cafe.png',
          storeName: 'Mercado Centro',
        }),
      ],
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
        alternativeOffers: [
          expect.objectContaining({
            id: 'offer-1',
            storeName: 'Mercado Centro',
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
