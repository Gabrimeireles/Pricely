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

function createOffer(
  input: Partial<StoreOfferEntity> &
    Pick<
      StoreOfferEntity,
      | 'id'
      | 'storeId'
      | 'storeName'
      | 'canonicalName'
      | 'displayName'
      | 'price'
      | 'sourceReceiptLineItemId'
      | 'observedAt'
    >,
): StoreOfferEntity {
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
    const result = service.optimize(
      createList(),
      [
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
      ],
      'global_full',
    );

    expect(
      result.selections.every(
        (selection) => selection.establishmentName === 'Mercado B',
      ),
    ).toBe(true);
    expect(result.totalEstimatedCost).toBe(17);
    expect(result.estimatedSavings).toBe(4);
    expect(result.selections[0]).toEqual(
      expect.objectContaining({
        comparisonPriceAmount: 10,
        regionalAveragePriceAmount: 9,
        savingsVsComparison: 2,
      }),
    );
    expect(result.explanationPayload).toEqual(
      expect.objectContaining({
        version: 1,
        constraints: expect.objectContaining({
          mode: 'global_full',
          singleStoreRequired: false,
          unresolvedItemPolicy: 'flag_missing_or_review',
        }),
        selectedOffers: expect.arrayContaining([
          expect.objectContaining({
            shoppingListItemId: 'item-1',
            productOfferId: 'offer-b1',
            storeId: 'store-b',
            priceAmount: 8,
            savingsVsComparison: 2,
          }),
        ]),
        rejectedAlternatives: expect.arrayContaining([
          expect.objectContaining({
            shoppingListItemId: 'item-1',
            productOfferId: 'offer-a1',
            reason: 'higher_price_or_lower_rank',
          }),
        ]),
        savingsComparisons: expect.arrayContaining([
          expect.objectContaining({
            shoppingListItemId: 'item-1',
            selectedPriceAmount: 8,
            comparisonPriceAmount: 10,
            regionalAveragePriceAmount: 9,
            savingsVsComparison: 2,
          }),
        ]),
      }),
    );
  });

  it('calculates savings against the same variant in another establishment', () => {
    const list = createList();
    list.items = [
      {
        ...list.items[0],
        catalogProductId: 'product-arroz',
        lockedProductVariantId: 'variant-camil',
        brandPreferenceMode: 'exact',
      },
    ];

    const result = service.optimize(
      list,
      [
        createOffer({
          id: 'offer-store-1',
          catalogProductId: 'product-arroz',
          productVariantId: 'variant-camil',
          storeId: 'store-1',
          storeName: 'Estabelecimento 1',
          canonicalName: 'arroz',
          displayName: 'Arroz Camil 5kg',
          price: 20.99,
          sourceReceiptLineItemId: 'src-1',
          observedAt: new Date().toISOString(),
        }),
        createOffer({
          id: 'offer-store-2',
          catalogProductId: 'product-arroz',
          productVariantId: 'variant-camil',
          storeId: 'store-2',
          storeName: 'Estabelecimento 2',
          canonicalName: 'arroz',
          displayName: 'Arroz Camil 5kg',
          price: 19.99,
          sourceReceiptLineItemId: 'src-2',
          observedAt: new Date().toISOString(),
        }),
      ],
      'global_full',
    );

    expect(result.selections[0]).toEqual(
      expect.objectContaining({
        establishmentName: 'Estabelecimento 2',
        priceAmount: 19.99,
        comparisonPriceAmount: 20.99,
        savingsVsComparison: 1,
      }),
    );
    expect(result.estimatedSavings).toBe(1);
  });

  it('concentrates selection in one store in global_unique mode', () => {
    const result = service.optimize(
      createList(),
      [
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
      ],
      'global_unique',
    );

    expect(
      result.selections.every(
        (selection) => selection.establishmentName === 'Mercado A',
      ),
    ).toBe(true);
    expect(result.coverageStatus).toBe('complete');
  });

  it('selects cheapest nearby item-level offers in local_multi mode with distance evidence', () => {
    const result = service.optimize(
      createList(),
      [
        createOffer({
          id: 'offer-a1',
          catalogProductId: 'product-arroz',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz A',
          price: 10,
          distanceKm: 1.2,
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
          distanceKm: 3.4,
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
          distanceKm: 1.2,
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
          distanceKm: 3.4,
          sourceReceiptLineItemId: 'src-b2',
          observedAt: new Date().toISOString(),
        }),
      ],
      'local_multi',
      {
        userLocationPreferenceId: 'location-1',
        coverageRadiusKm: 5,
        candidateEstablishmentCount: 2,
      },
    );

    expect(result.selections.map((selection) => selection.establishmentName)).toEqual([
      'Mercado B',
      'Mercado B',
    ]);
    expect(result.selections[0]).toEqual(
      expect.objectContaining({
        distanceKm: 3.4,
        decisionReason: expect.stringContaining('nearby offer'),
      }),
    );
    expect(result.explanationPayload?.constraints).toEqual(
      expect.objectContaining({
        mode: 'local_multi',
        singleStoreRequired: false,
        userLocationPreferenceId: 'location-1',
        coverageRadiusKm: 5,
        candidateEstablishmentCount: 2,
      }),
    );
    expect(result.explanationPayload?.selectedOffers[0]).toEqual(
      expect.objectContaining({
        distanceKm: 3.4,
      }),
    );
  });

  it('concentrates local_unique decisions in one nearby store', () => {
    const result = service.optimize(
      createList(),
      [
        createOffer({
          id: 'offer-a1',
          catalogProductId: 'product-arroz',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz A',
          price: 10,
          distanceKm: 1.2,
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
          price: 11,
          distanceKm: 1.2,
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
          price: 6,
          distanceKm: 2.8,
          sourceReceiptLineItemId: 'src-b1',
          observedAt: new Date().toISOString(),
        }),
      ],
      'local_unique',
    );

    expect(result.selections.every((selection) => selection.establishmentName === 'Mercado A')).toBe(true);
    expect(result.explanationPayload?.constraints).toEqual(
      expect.objectContaining({
        mode: 'local_unique',
        singleStoreRequired: true,
        selectedStoreId: 'store-a',
      }),
    );
  });

  it('prefers broader single-store coverage in local mode', () => {
    const result = service.optimize(
      createList(),
      [
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
      ],
      'local',
    );

    expect(result.selections[0]?.establishmentName).toBe('Mercado A');
    expect(result.selections[1]?.establishmentName).toBe('Mercado A');
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

  it('ignores unavailable offers and returns partial coverage for missing items', () => {
    const result = service.optimize(
      createList(),
      [
        createOffer({
          id: 'offer-unavailable',
          catalogProductId: 'product-arroz',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz indisponivel',
          price: 1,
          sourceReceiptLineItemId: 'src-a1',
          observedAt: new Date().toISOString(),
          availabilityStatus: 'unavailable',
        }),
        createOffer({
          id: 'offer-feijao',
          catalogProductId: 'product-feijao',
          storeId: 'store-b',
          storeName: 'Mercado B',
          canonicalName: 'feijao',
          displayName: 'Feijao',
          price: 9,
          sourceReceiptLineItemId: 'src-b1',
          observedAt: new Date().toISOString(),
        }),
      ],
      'global_full',
    );

    expect(result.coverageStatus).toBe('partial');
    expect(result.selections[0]).toMatchObject({
      selectionStatus: 'missing',
      rejectedReason: 'no_active_available_offer',
    });
    expect(result.selections[1]).toMatchObject({
      selectionStatus: 'selected',
      decisionReason: expect.stringContaining(
        'cheapest confirmed regional offer',
      ),
    });
  });

  it('marks low-confidence promotional evidence without blocking the selection', () => {
    const list = createList();
    list.items = [list.items[0]];

    const result = service.optimize(
      list,
      [
        createOffer({
          id: 'offer-promo-low-confidence',
          catalogProductId: 'product-arroz',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz promocional',
          price: 7.99,
          sourceReceiptLineItemId: 'receipt-derived',
          observedAt: new Date().toISOString(),
          confidenceScore: 0.6,
        }),
      ],
      'global_full',
    );

    expect(result.selections[0]).toMatchObject({
      selectionStatus: 'selected',
      confidenceNotice: 'Selected from low-confidence market evidence.',
    });
  });

  it('carries offer trust factor evidence into optimization decisions', () => {
    const list = createList();
    list.items = [list.items[0]];

    const result = service.optimize(
      list,
      [
        createOffer({
          id: 'offer-trusted',
          catalogProductId: 'product-arroz',
          storeId: 'store-a',
          storeName: 'Mercado A',
          canonicalName: 'arroz',
          displayName: 'Arroz validado',
          price: 8.49,
          sourceReceiptLineItemId: 'receipt-derived',
          observedAt: new Date().toISOString(),
          trustFactor: 82,
          trustLevel: 'high',
          trustEvidenceCount: 4,
          trustFreshnessDays: 2,
          trustLastValidatedAt: new Date().toISOString(),
          trustExplanation:
            '4 notas fiscais confiaveis; ultima validacao ha 2 dias; trust factor 82/100.',
        }),
      ],
      'global_full',
    );

    expect(result.selections[0]).toMatchObject({
      selectionStatus: 'selected',
      trustFactor: 82,
      trustLevel: 'high',
      trustEvidenceCount: 4,
      trustFreshnessDays: 2,
    });
    expect(result.explanationPayload?.selectedOffers[0]).toEqual(
      expect.objectContaining({
        trustFactor: 82,
        trustEvidenceCount: 4,
      }),
    );
  });
});
