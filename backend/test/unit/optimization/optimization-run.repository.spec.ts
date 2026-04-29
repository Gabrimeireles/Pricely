import { OptimizationRunRepository } from '../../../src/optimization/infrastructure/optimization-run.repository';

describe('OptimizationRunRepository', () => {
  it('creates queued optimization runs and fetches the latest run for a list owner', async () => {
    const prisma = {
      optimizationRun: {
        create: jest.fn().mockResolvedValue({
          id: 'run-1',
          shoppingListId: 'list-1',
          userId: 'user-1',
          mode: 'global_full',
          regionId: 'region-1',
          preferredEstablishmentId: null,
          jobId: 'job-1',
          status: 'queued',
          coverageStatus: 'none',
          totalEstimatedCost: null,
          estimatedSavings: null,
          summary: null,
          createdAt: new Date('2026-04-27T10:00:00Z'),
          completedAt: null,
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'run-1',
          shoppingListId: 'list-1',
          userId: 'user-1',
          mode: 'global_full',
          regionId: 'region-1',
          preferredEstablishmentId: null,
          jobId: 'job-1',
          status: 'completed',
          coverageStatus: 'complete',
          totalEstimatedCost: 52.4,
          estimatedSavings: 12.1,
          summary: 'Resumo',
          createdAt: new Date('2026-04-27T10:00:00Z'),
          completedAt: new Date('2026-04-27T10:01:00Z'),
          optimizationSelections: [],
        }),
      },
    };

    const repository = new OptimizationRunRepository(prisma as never);

    await expect(
      repository.createQueuedRun({
        shoppingListId: 'list-1',
        userId: 'user-1',
        mode: 'global_full',
        regionId: 'region-1',
        jobId: 'job-1',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'run-1',
        status: 'queued',
      }),
    );

    await expect(
      repository.findLatestForUser('user-1', 'list-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'run-1',
        status: 'completed',
      }),
    );
  });
});
