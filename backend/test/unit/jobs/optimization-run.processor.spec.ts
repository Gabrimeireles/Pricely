import { OptimizationRunProcessor } from '../../../src/jobs/optimization-run.processor';

describe('OptimizationRunProcessor', () => {
  it('ignores missing optimization runs', async () => {
    const prisma = {};
    const shoppingListsService = { getById: jest.fn() };
    const storeOfferRepository = { findByCanonicalNames: jest.fn() };
    const multiMarketOptimizerService = { optimize: jest.fn() };
    const optimizationRunRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    const processor = new OptimizationRunProcessor(
      prisma as never,
      shoppingListsService as never,
      storeOfferRepository as never,
      multiMarketOptimizerService as never,
      optimizationRunRepository as never,
    );

    await expect(processor.process('missing-run')).resolves.toBeUndefined();
    expect(shoppingListsService.getById).not.toHaveBeenCalled();
  });

  it('persists completed selections and shopping-list readiness after computing the plan', async () => {
    const transaction = jest.fn().mockResolvedValue([]);
    const prisma = {
      optimizationRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'run-1',
          userId: 'user-1',
          shoppingListId: 'list-1',
          mode: 'global_full',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      optimizationSelection: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
      shoppingList: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: transaction,
    };

    const shoppingListsService = {
      getById: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [
          {
            id: 'item-1',
            normalizedName: 'cafe-torrado-500g',
          },
        ],
      }),
    };
    const storeOfferRepository = {
      findByListItems: jest.fn().mockResolvedValue([{ id: 'offer-1' }]),
    };
    const multiMarketOptimizerService = {
      optimize: jest.fn().mockReturnValue({
        totalEstimatedCost: 15.9,
        estimatedSavings: 2.1,
        coverageStatus: 'complete',
        explanationSummary: '1 item encontrado.',
        selections: [
          {
            shoppingListItemId: 'item-1',
            productOfferId: 'offer-1',
            selectionStatus: 'selected',
            estimatedCost: 15.9,
            confidenceNotice: 'high',
          },
        ],
        explanationPayload: {
          version: 1,
          constraints: {
            mode: 'global_full',
            singleStoreRequired: false,
            exactVariantItemIds: [],
            unresolvedItemPolicy: 'flag_missing_or_review',
          },
          selectedOffers: [
            {
              shoppingListItemId: 'item-1',
              productOfferId: 'offer-1',
              estimatedCost: 15.9,
            },
          ],
          rejectedAlternatives: [],
          savingsComparisons: [],
          dataQualityWarnings: [],
        },
      }),
    };
    const optimizationRunRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'run-1',
        userId: 'user-1',
        shoppingListId: 'list-1',
        mode: 'global_full',
        regionId: 'region-1',
      }),
    };

    const processor = new OptimizationRunProcessor(
      prisma as never,
      shoppingListsService as never,
      storeOfferRepository as never,
      multiMarketOptimizerService as never,
      optimizationRunRepository as never,
    );

    await processor.process('run-1');

    expect(storeOfferRepository.findByListItems).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'item-1',
          normalizedName: 'cafe-torrado-500g',
        }),
      ],
      {
        regionId: 'region-1',
        establishmentIds: undefined,
      },
    );
    expect(multiMarketOptimizerService.optimize).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-1' }),
      [{ id: 'offer-1' }],
      'global_full',
      {
        candidateEstablishmentCount: 1,
      },
    );
    expect(prisma.optimizationSelection.deleteMany).toHaveBeenCalledWith({
      where: { optimizationRunId: 'run-1' },
    });
    expect(prisma.optimizationSelection.createMany).toHaveBeenCalled();
    expect(prisma.optimizationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'completed',
          coverageStatus: 'complete',
          explanationPayload: expect.objectContaining({
            version: 1,
            selectedOffers: [
              expect.objectContaining({
                shoppingListItemId: 'item-1',
                productOfferId: 'offer-1',
              }),
            ],
          }),
        }),
      }),
    );
    expect(prisma.shoppingList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: { status: 'ready' },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('uses catalog-backed list items to load offers even when normalizedName is broader than the product canonical name', async () => {
    const transaction = jest.fn().mockResolvedValue([]);
    const prisma = {
      optimizationRun: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      optimizationSelection: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
      shoppingList: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: transaction,
    };

    const shoppingListsService = {
      getById: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [
          {
            id: 'item-1',
            requestedName: 'Arroz',
            normalizedName: 'arroz',
            catalogProductId: 'product-1',
          },
        ],
      }),
    };
    const storeOfferRepository = {
      findByListItems: jest.fn().mockResolvedValue([{ id: 'offer-1', catalogProductId: 'product-1' }]),
    };
    const multiMarketOptimizerService = {
      optimize: jest.fn().mockReturnValue({
        totalEstimatedCost: 22.9,
        estimatedSavings: 0,
        coverageStatus: 'complete',
        explanationSummary: '1 item encontrado.',
        selections: [
          {
            shoppingListItemId: 'item-1',
            productOfferId: 'offer-1',
            selectionStatus: 'selected',
            estimatedCost: 22.9,
          },
        ],
      }),
    };
    const optimizationRunRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'run-1',
        userId: 'user-1',
        shoppingListId: 'list-1',
        mode: 'global_full',
        regionId: 'region-1',
      }),
    };

    const processor = new OptimizationRunProcessor(
      prisma as never,
      shoppingListsService as never,
      storeOfferRepository as never,
      multiMarketOptimizerService as never,
      optimizationRunRepository as never,
    );

    await processor.process('run-1');

    expect(storeOfferRepository.findByListItems).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          requestedName: 'Arroz',
          normalizedName: 'arroz',
          catalogProductId: 'product-1',
        }),
      ],
      {
        regionId: 'region-1',
        establishmentIds: undefined,
      },
    );
    expect(multiMarketOptimizerService.optimize).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-1' }),
      [expect.objectContaining({ id: 'offer-1', catalogProductId: 'product-1' })],
      'global_full',
      {
        candidateEstablishmentCount: 1,
      },
    );
  });

  it('filters local optimization offers to establishments inside the saved radius', async () => {
    const transaction = jest.fn().mockResolvedValue([]);
    const prisma = {
      userLocationPreference: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'location-1',
          latitude: { toString: () => '-23.566000' },
          longitude: { toString: () => '-46.684000' },
          coverageRadiusKm: { toString: () => '5' },
        }),
      },
      establishment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'store-near',
            latitude: { toString: () => '-23.566200' },
            longitude: { toString: () => '-46.684200' },
          },
          {
            id: 'store-far',
            latitude: { toString: () => '-23.650000' },
            longitude: { toString: () => '-46.720000' },
          },
        ]),
      },
      optimizationRun: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      optimizationSelection: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
      shoppingList: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: transaction,
    };
    const shoppingListsService = {
      getById: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [{ id: 'item-1', catalogProductId: 'product-1' }],
      }),
    };
    const storeOfferRepository = {
      findByListItems: jest.fn().mockResolvedValue([
        {
          id: 'offer-near',
          storeId: 'store-near',
          catalogProductId: 'product-1',
        },
      ]),
    };
    const multiMarketOptimizerService = {
      optimize: jest.fn().mockReturnValue({
        totalEstimatedCost: 10,
        estimatedSavings: 0,
        coverageStatus: 'complete',
        explanationSummary: 'ok',
        explanationPayload: {
          version: 1,
          constraints: {
            mode: 'local_multi',
            singleStoreRequired: false,
            candidateEstablishmentCount: 1,
            exactVariantItemIds: [],
            unresolvedItemPolicy: 'flag_missing_or_review',
          },
          selectedOffers: [],
          rejectedAlternatives: [],
          savingsComparisons: [],
          dataQualityWarnings: [],
        },
        selections: [],
      }),
    };
    const optimizationRunRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'run-1',
        userId: 'user-1',
        shoppingListId: 'list-1',
        mode: 'local_multi',
        regionId: 'region-1',
        userLocationPreferenceId: 'location-1',
        coverageRadiusKm: 5,
      }),
    };

    const processor = new OptimizationRunProcessor(
      prisma as never,
      shoppingListsService as never,
      storeOfferRepository as never,
      multiMarketOptimizerService as never,
      optimizationRunRepository as never,
    );

    await processor.process('run-1');

    expect(storeOfferRepository.findByListItems).toHaveBeenCalledWith(
      [expect.objectContaining({ catalogProductId: 'product-1' })],
      {
        regionId: 'region-1',
        establishmentIds: ['store-near'],
      },
    );
    expect(multiMarketOptimizerService.optimize).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-1' }),
      [
        expect.objectContaining({
          id: 'offer-near',
          distanceKm: expect.any(Number),
        }),
      ],
      'local_multi',
      {
        userLocationPreferenceId: 'location-1',
        coverageRadiusKm: 5,
        candidateEstablishmentCount: 1,
      },
    );
  });
});
