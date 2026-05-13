import { BadRequestException } from '@nestjs/common';

import { OptimizationResultService } from '../../../src/optimization/application/optimization-result.service';

function createService(prismaOverrides: Record<string, unknown> = {}) {
  const prisma = {
    region: {
      findUnique: jest.fn().mockResolvedValue({ id: 'region-1' }),
      findFirst: jest.fn(),
    },
    userLocationPreference: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    establishment: {
      findMany: jest.fn(),
    },
    ...prismaOverrides,
  };
  const shoppingListsService = {
    getById: jest.fn().mockResolvedValue({
      id: 'list-1',
      preferredRegionId: 'region-1',
      items: [{ id: 'item-1', catalogProductId: 'product-1' }],
    }),
  };
  const entitlementsService = {
    ensureOptimizationAllowed: jest.fn().mockResolvedValue(undefined),
    consumeOptimizationToken: jest.fn(),
  };
  const processingJobsService = {
    createQueuedJob: jest.fn(),
  };
  const optimizationRunRepository = {
    createQueuedRun: jest.fn(),
    findLatestForUser: jest.fn(),
  };
  const optimizationQueue = {
    add: jest.fn(),
  };
  const service = new OptimizationResultService(
    prisma as never,
    shoppingListsService as never,
    entitlementsService as never,
    processingJobsService as never,
    optimizationRunRepository as never,
    optimizationQueue as never,
  );

  return {
    service,
    prisma,
    processingJobsService,
    optimizationRunRepository,
    optimizationQueue,
  };
}

describe('OptimizationResultService location-aware validation', () => {
  it('rejects local optimization when the user has no saved location preference', async () => {
    const { service, processingJobsService } = createService();

    await expect(
      service.createOptimizationRun('user-1', 'list-1', {
        mode: 'local_multi',
        regionId: 'region-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(processingJobsService.createQueuedJob).not.toHaveBeenCalled();
  });

  it('rejects local optimization when the saved radius has no active geocoded stores', async () => {
    const { service, prisma, optimizationQueue } = createService();
    prisma.userLocationPreference.findFirst.mockResolvedValue({
      id: 'location-1',
      latitude: { toString: () => '-23.566000' },
      longitude: { toString: () => '-46.684000' },
      coverageRadiusKm: { toString: () => '5' },
    });
    prisma.establishment.findMany.mockResolvedValue([
      {
        latitude: { toString: () => '-23.700000' },
        longitude: { toString: () => '-46.800000' },
      },
    ]);

    await expect(
      service.createOptimizationRun('user-1', 'list-1', {
        mode: 'local_unique',
        regionId: 'region-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(optimizationQueue.add).not.toHaveBeenCalled();
  });

  it('queues local optimization with a location snapshot when coverage is available', async () => {
    const { service, prisma, processingJobsService, optimizationRunRepository } =
      createService();
    prisma.userLocationPreference.findFirst.mockResolvedValue({
      id: 'location-1',
      latitude: { toString: () => '-23.566000' },
      longitude: { toString: () => '-46.684000' },
      coverageRadiusKm: { toString: () => '5' },
    });
    prisma.establishment.findMany.mockResolvedValue([
      {
        latitude: { toString: () => '-23.566200' },
        longitude: { toString: () => '-46.684200' },
      },
    ]);
    processingJobsService.createQueuedJob.mockResolvedValue({
      id: 'job-1',
    });
    optimizationRunRepository.createQueuedRun.mockResolvedValue({
      id: 'run-1',
      createdAt: '2026-05-13T10:00:00.000Z',
    });

    await expect(
      service.createOptimizationRun('user-1', 'list-1', {
        mode: 'local_multi',
        regionId: 'region-1',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'run-1',
        mode: 'local_multi',
        status: 'queued',
      }),
    );
    expect(optimizationRunRepository.createQueuedRun).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'local_multi',
        userLocationPreferenceId: 'location-1',
        candidateEstablishmentCount: 1,
      }),
    );
  });
});
