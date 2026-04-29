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
      }),
    };
    const optimizationRunRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'run-1',
        userId: 'user-1',
        shoppingListId: 'list-1',
        mode: 'global_full',
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

    expect(storeOfferRepository.findByListItems).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'item-1',
        normalizedName: 'cafe-torrado-500g',
      }),
    ]);
    expect(multiMarketOptimizerService.optimize).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-1' }),
      [{ id: 'offer-1' }],
      'global_full',
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

    expect(storeOfferRepository.findByListItems).toHaveBeenCalledWith([
      expect.objectContaining({
        requestedName: 'Arroz',
        normalizedName: 'arroz',
        catalogProductId: 'product-1',
      }),
    ]);
    expect(multiMarketOptimizerService.optimize).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'list-1' }),
      [expect.objectContaining({ id: 'offer-1', catalogProductId: 'product-1' })],
      'global_full',
    );
  });
});
