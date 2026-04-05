import { type ShoppingListEntity } from '../../../src/lists/domain/shopping-list.entity';
import { MultiMarketOptimizerService } from '../../../src/optimization/domain/multi-market-optimizer.service';
import { type StoreOfferEntity } from '../../../src/stores/domain/store-offer.entity';

describe('MultiMarketOptimizerService', () => {
  const service = new MultiMarketOptimizerService();

  it('selects the cheapest confirmed offer for each normalized list item', () => {
    const shoppingList: ShoppingListEntity = {
      id: 'sl_1',
      name: 'Weekly groceries',
      mode: 'multi_market',
      status: 'ready',
      items: [
        {
          id: 'item_rice',
          requestedName: 'Arroz 5kg',
          normalizedName: 'arroz 5 kg',
          resolutionStatus: 'matched',
          quantity: 1,
        },
        {
          id: 'item_milk',
          requestedName: 'Leite integral',
          normalizedName: 'leite integral',
          resolutionStatus: 'matched',
          quantity: 2,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const offers: StoreOfferEntity[] = [
      {
        id: 'offer-rice-a',
        storeId: 'store-a',
        storeName: 'Store A',
        canonicalName: 'arroz 5 kg',
        displayName: 'Arroz 5kg',
        price: 32.9,
        availabilityStatus: 'available',
        confidenceScore: 0.9,
        sourceReceiptLineItemId: 'rli-1',
        observedAt: new Date().toISOString(),
      },
      {
        id: 'offer-rice-b',
        storeId: 'store-b',
        storeName: 'Store B',
        canonicalName: 'arroz 5 kg',
        displayName: 'Arroz 5kg',
        price: 29.9,
        availabilityStatus: 'available',
        confidenceScore: 0.9,
        sourceReceiptLineItemId: 'rli-2',
        observedAt: new Date().toISOString(),
      },
      {
        id: 'offer-milk-a',
        storeId: 'store-a',
        storeName: 'Store A',
        canonicalName: 'leite integral',
        displayName: 'Leite Integral 1L',
        price: 5.49,
        availabilityStatus: 'available',
        confidenceScore: 0.92,
        sourceReceiptLineItemId: 'rli-3',
        observedAt: new Date().toISOString(),
      },
    ];

    const result = service.optimize(shoppingList, offers);

    expect(result.coverageStatus).toBe('complete');
    expect(result.totalEstimatedCost).toBe(40.88);
    expect(result.selections).toHaveLength(2);
    expect(result.selections[0]).toMatchObject({
      shoppingListItemId: 'item_rice',
      storeOfferId: 'offer-rice-b',
      selectionStatus: 'selected',
      estimatedCost: 29.9,
    });
    expect(result.selections[1]).toMatchObject({
      shoppingListItemId: 'item_milk',
      storeOfferId: 'offer-milk-a',
      selectionStatus: 'selected',
      estimatedCost: 10.98,
    });
  });

  it('marks items as unresolved or unavailable when there is no safe selection', () => {
    const shoppingList: ShoppingListEntity = {
      id: 'sl_2',
      name: 'Partial list',
      mode: 'multi_market',
      status: 'ready',
      items: [
        {
          id: 'item_unknown',
          requestedName: 'Produto desconhecido',
          resolutionStatus: 'unresolved',
        },
        {
          id: 'item_beans',
          requestedName: 'Feijao preto',
          normalizedName: 'feijao preto',
          resolutionStatus: 'matched',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = service.optimize(shoppingList, []);

    expect(result.coverageStatus).toBe('partial');
    expect(result.totalEstimatedCost).toBe(0);
    expect(result.selections).toEqual([
      expect.objectContaining({
        shoppingListItemId: 'item_unknown',
        selectionStatus: 'unresolved',
      }),
      expect.objectContaining({
        shoppingListItemId: 'item_beans',
        selectionStatus: 'unavailable',
      }),
    ]);
  });
});
