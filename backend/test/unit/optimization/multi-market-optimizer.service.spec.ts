import { MultiMarketOptimizerService } from '../../../src/optimization/domain/multi-market-optimizer.service';
import { type ShoppingListEntity } from '../../../src/lists/domain/shopping-list.entity';
import { type StoreOfferEntity } from '../../../src/stores/domain/store-offer.entity';

function createList(): ShoppingListEntity {
  return {
    id: 'list-1',
    userId: 'user-1',
    name: 'Lista',
    preferredRegionId: 'sao-paulo-sp',
    status: 'ready',
    lastMode: 'global_full',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        catalogProductId: 'product-arroz',
        brandPreferenceMode: 'any',
        preferredBrandNames: [],
        requestedName: 'Arroz',
        normalizedName: 'arroz',
        quantity: 1,
        unitLabel: 'un',
        purchaseStatus: 'pending',
        resolutionStatus: 'matched',
      },
      {
        id: 'item-2',
        catalogProductId: 'product-feijao',
        brandPreferenceMode: 'any',
        preferredBrandNames: [],
        requestedName: 'Feijao',
        normalizedName: 'feijao',
        quantity: 1,
        unitLabel: 'un',
        purchaseStatus: 'pending',
        resolutionStatus: 'matched',
      },
    ],
  };
}

function createOffer(input: Partial<StoreOfferEntity> & Pick<StoreOfferEntity, 'id' | 'storeId' | 'storeName' | 'canonicalName' | 'displayName' | 'price' | 'sourceReceiptLineItemId' | 'observedAt'>): StoreOfferEntity {
  return {
    catalogProductId: undefined,
    productVariantId: undefined,
    brandName: undefined,
    variantName: undefined,
    quantityContext: undefined,
    availabilityStatus: 'available',
    confidenceScore: 0.9,
    ...input,
  };
}

describe('MultiMarketOptimizerService', () => {
  const service = new MultiMarketOptimizerService();

  it('selects the cheapest offer per item in global_full mode', () => {
    const result = service.optimize(createList(), [
      createOffer({
        id: 'offer-a1',
        catalogProductId: 'product-arroz',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'arroz',
        displayName: 'Arroz A',
        price: 10,
        sourceReceiptLineItemId: 'src-a1',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-b1',
        catalogProductId: 'product-arroz',
        storeId: 'store-b',
        storeName: 'Mercado B',
        canonicalName: 'arroz',
        displayName: 'Arroz B',
        price: 8,
        sourceReceiptLineItemId: 'src-b1',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-a2',
        catalogProductId: 'product-feijao',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'feijao',
        displayName: 'Feijao A',
        price: 11,
        sourceReceiptLineItemId: 'src-a2',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-b2',
        catalogProductId: 'product-feijao',
        storeId: 'store-b',
        storeName: 'Mercado B',
        canonicalName: 'feijao',
        displayName: 'Feijao B',
        price: 9,
        sourceReceiptLineItemId: 'src-b2',
        observedAt: new Date().toISOString(),
      }),
    ], 'global_full');

    expect(result.selections.every((selection) => selection.establishmentName === 'Mercado B')).toBe(true);
    expect(result.totalEstimatedCost).toBe(17);
  });

  it('concentrates selection in one store in global_unique mode', () => {
    const result = service.optimize(createList(), [
      createOffer({
        id: 'offer-a1',
        catalogProductId: 'product-arroz',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'arroz',
        displayName: 'Arroz A',
        price: 9,
        sourceReceiptLineItemId: 'src-a1',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-a2',
        catalogProductId: 'product-feijao',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'feijao',
        displayName: 'Feijao A',
        price: 12,
        sourceReceiptLineItemId: 'src-a2',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-b1',
        catalogProductId: 'product-arroz',
        storeId: 'store-b',
        storeName: 'Mercado B',
        canonicalName: 'arroz',
        displayName: 'Arroz B',
        price: 7,
        sourceReceiptLineItemId: 'src-b1',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-c2',
        catalogProductId: 'product-feijao',
        storeId: 'store-c',
        storeName: 'Mercado C',
        canonicalName: 'feijao',
        displayName: 'Feijao C',
        price: 6,
        sourceReceiptLineItemId: 'src-c2',
        observedAt: new Date().toISOString(),
      }),
    ], 'global_unique');

    expect(result.selections.every((selection) => selection.establishmentName === 'Mercado A')).toBe(true);
    expect(result.coverageStatus).toBe('complete');
  });

  it('prefers broader single-store coverage in local mode', () => {
    const result = service.optimize(createList(), [
      createOffer({
        id: 'offer-a1',
        catalogProductId: 'product-arroz',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'arroz',
        displayName: 'Arroz A',
        price: 8,
        sourceReceiptLineItemId: 'src-a1',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-a2',
        catalogProductId: 'product-feijao',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'feijao',
        displayName: 'Feijao A',
        price: 13,
        sourceReceiptLineItemId: 'src-a2',
        observedAt: new Date().toISOString(),
      }),
      createOffer({
        id: 'offer-b1',
        catalogProductId: 'product-arroz',
        storeId: 'store-b',
        storeName: 'Mercado B',
        canonicalName: 'arroz',
        displayName: 'Arroz B',
        price: 5,
        sourceReceiptLineItemId: 'src-b1',
        observedAt: new Date().toISOString(),
      }),
    ], 'local');

    expect(result.selections[0]?.establishmentName).toBe('Mercado A');
    expect(result.selections[1]?.establishmentName).toBe('Mercado A');
  });

  it('falls back from preferred brands when no preferred brand exists', () => {
    const list = createList();
    list.items[0] = {
      ...list.items[0],
      brandPreferenceMode: 'preferred',
      preferredBrandNames: ['Camil'],
    };

    const result = service.optimize(list, [
      createOffer({
        id: 'offer-a1',
        catalogProductId: 'product-arroz',
        brandName: 'Tio Joao',
        storeId: 'store-a',
        storeName: 'Mercado A',
        canonicalName: 'arroz',
        displayName: 'Arroz A',
        price: 9,
        sourceReceiptLineItemId: 'src-a1',
        observedAt: new Date().toISOString(),
      }),
    ], 'global_full');

    expect(result.selections[0]?.selectionStatus).toBe('selected');
    expect(result.selections[0]?.establishmentName).toBe('Mercado A');
  });

  it('enforces exact variant selection when a locked variant is required', () => {
    const list = createList();
    list.items[0] = {
      ...list.items[0],
      lockedProductVariantId: 'variant-camil',
      brandPreferenceMode: 'exact',
      preferredBrandNames: [],
    };

    const result = service.optimize(
      list,
      [
        createOffer({
          id: 'offer-a1',
          catalogProductId: 'product-arroz',
          productVariantId: 'variant-tio-joao',
          brandName: 'Tio Joao',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz A',
          price: 9,
          sourceReceiptLineItemId: 'src-a1',
          observedAt: new Date().toISOString(),
        }),
      ],
      'global_full',
    );

    expect(result.selections[0]).toEqual(
      expect.objectContaining({
        shoppingListItemId: 'item-1',
        selectionStatus: 'missing',
      }),
    );
  });
});
