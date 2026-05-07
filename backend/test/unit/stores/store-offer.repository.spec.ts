import { ProductNormalizerService } from '../../../src/catalog/application/product-normalizer.service';
import { StoreOfferRepository } from '../../../src/stores/infrastructure/store-offer.repository';

describe('StoreOfferRepository', () => {
  it('matches textual list items against branded offer variants when catalog ids are missing', async () => {
    const prisma = {
      productOffer: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'offer-arroz',
            catalogProductId: 'product-arroz',
            productVariantId: 'variant-arroz-camil',
            catalogProduct: {
              name: 'Arroz tipo 1 5kg',
            },
            productVariant: {
              displayName: 'Arroz Camil tipo 1 5kg',
              brandName: 'Camil',
            },
            establishmentId: 'store-1',
            establishment: {
              unitName: 'Unidade Pinheiros',
            },
            displayName: 'Arroz Camil tipo 1 5kg',
            packageLabel: '5 kg',
            priceAmount: '21.90',
            basePriceAmount: '21.90',
            promotionalPriceAmount: null,
            availabilityStatus: 'available',
            confidenceLevel: 'high',
            sourceReference: 'Seed comparativo',
            sourceType: 'admin',
            observedAt: new Date('2026-05-07T00:00:00.000Z'),
          },
          {
            id: 'offer-cafe',
            catalogProductId: 'product-cafe',
            productVariantId: 'variant-cafe-pilao',
            catalogProduct: {
              name: 'Cafe torrado',
            },
            productVariant: {
              displayName: 'Cafe Pilao 500g',
              brandName: 'Pilao',
            },
            establishmentId: 'store-1',
            establishment: {
              unitName: 'Unidade Pinheiros',
            },
            displayName: 'Cafe Pilao 500g',
            packageLabel: '500 g',
            priceAmount: '15.90',
            basePriceAmount: '18.90',
            promotionalPriceAmount: '15.90',
            availabilityStatus: 'available',
            confidenceLevel: 'high',
            sourceReference: 'Seed local',
            sourceType: 'admin',
            observedAt: new Date('2026-05-07T00:00:00.000Z'),
          },
        ]),
      },
    };
    const normalizer = new ProductNormalizerService();
    const repository = new StoreOfferRepository(prisma as never, normalizer);

    const offers = await repository.findByListItems([
      {
        normalizedName: normalizer.normalize('Camil · Arroz Camil tipo 1 5kg')
          .canonicalName,
      },
      {
        normalizedName: normalizer.normalize('Pilao · Cafe Pilao 500g')
          .canonicalName,
      },
    ]);

    expect(offers.map((offer) => offer.id)).toEqual([
      'offer-arroz',
      'offer-cafe',
    ]);
    expect(offers[0].matchingCanonicalNames).toContain(
      'camil arroz camil tipo 1',
    );
    expect(offers[1].matchingCanonicalNames).toContain('pilao cafe pilao');
  });
});
