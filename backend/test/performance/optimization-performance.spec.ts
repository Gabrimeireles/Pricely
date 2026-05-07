import { performance } from 'node:perf_hooks';

import { type ShoppingListEntity } from '../../src/lists/domain/shopping-list.entity';
import { MultiMarketOptimizerService } from '../../src/optimization/domain/multi-market-optimizer.service';
import { type StoreOfferEntity } from '../../src/stores/domain/store-offer.entity';

function createStandardList(itemCount: number): ShoppingListEntity {
  return {
    id: 'standard-list',
    userId: 'user-1',
    name: 'Standard performance list',
    preferredRegionId: 'sao-paulo-sp',
    status: 'ready',
    lastMode: 'global_full',
    latestEstimatedSavings: 0,
    createdAt: '2026-05-06T00:00:00.000Z',
    updatedAt: '2026-05-06T00:00:00.000Z',
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: `item-${index}`,
      catalogProductId: `product-${index}`,
      brandPreferenceMode: index % 7 === 0 ? 'exact' : 'any',
      lockedProductVariantId: index % 7 === 0 ? `variant-${index}-0` : undefined,
      preferredBrandNames: [],
      requestedName: `Produto ${index}`,
      normalizedName: `produto-${index}`,
      quantity: (index % 3) + 1,
      unitLabel: 'un',
      purchaseStatus: 'pending',
      resolutionStatus: 'matched',
    })),
  };
}

function createStandardOffers(
  itemCount: number,
  storesPerItem: number,
  variantsPerItem: number,
): StoreOfferEntity[] {
  return Array.from({ length: itemCount }).flatMap((_, itemIndex) =>
    Array.from({ length: storesPerItem }).flatMap((__, storeIndex) =>
      Array.from({ length: variantsPerItem }).map((___, variantIndex) => ({
        id: `offer-${itemIndex}-${storeIndex}-${variantIndex}`,
        catalogProductId: `product-${itemIndex}`,
        productVariantId: `variant-${itemIndex}-${variantIndex}`,
        storeId: `store-${storeIndex}`,
        storeName: `Mercado ${storeIndex}`,
        canonicalName: `produto-${itemIndex}`,
        displayName: `Produto ${itemIndex} variante ${variantIndex}`,
        price: Number((8 + itemIndex * 0.12 + storeIndex * 0.45 + variantIndex * 0.2).toFixed(2)),
        quantityContext: 'un',
        availabilityStatus: 'available',
        confidenceScore: storeIndex % 5 === 0 ? 0.7 : 0.92,
        sourceReceiptLineItemId: `receipt-line-${itemIndex}-${storeIndex}-${variantIndex}`,
        observedAt: '2026-05-06T00:00:00.000Z',
      })),
    ),
  );
}

describe('MultiMarketOptimizerService performance', () => {
  it('keeps a standard medium basket optimization bounded', () => {
    const service = new MultiMarketOptimizerService();
    const list = createStandardList(40);
    const offers = createStandardOffers(40, 8, 3);

    const startedAt = performance.now();
    const result = service.optimize(list, offers, 'global_full');
    const elapsedMs = performance.now() - startedAt;

    expect(result.coverageStatus).toBe('complete');
    expect(result.selections).toHaveLength(40);
    expect(result.explanationPayload?.selectedOffers).toHaveLength(40);
    expect(elapsedMs).toBeLessThan(750);
  });

  it('keeps a constrained single-store basket optimization bounded', () => {
    const service = new MultiMarketOptimizerService();
    const list = createStandardList(40);
    const offers = createStandardOffers(40, 8, 3);

    const startedAt = performance.now();
    const result = service.optimize(list, offers, 'global_unique');
    const elapsedMs = performance.now() - startedAt;

    expect(result.coverageStatus).toBe('complete');
    expect(result.selections).toHaveLength(40);
    expect(result.explanationPayload?.constraints.singleStoreRequired).toBe(true);
    expect(elapsedMs).toBeLessThan(750);
  });
});
