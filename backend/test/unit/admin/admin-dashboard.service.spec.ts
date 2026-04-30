import { Logger } from '@nestjs/common';

import { AdminDashboardService } from '../../../src/admin/application/admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('aggregates metrics, queue health, and processing job projections', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      userAccount: { count: jest.fn().mockResolvedValue(12) },
      shoppingList: { count: jest.fn().mockResolvedValue(24) },
      optimizationRun: {
        count: jest.fn().mockResolvedValue(18),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            estimatedSavings: 321.45,
          },
        }),
      },
      region: { count: jest.fn().mockResolvedValue(3) },
      establishment: { count: jest.fn().mockResolvedValue(17) },
      productOffer: { count: jest.fn().mockResolvedValue(42) },
      catalogProduct: { count: jest.fn().mockResolvedValue(11) },
      processingJob: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'job-1',
            queueName: 'optimization',
            jobType: 'optimization',
            resourceType: 'shopping_list',
            resourceId: 'list-1',
            status: 'queued',
            attemptCount: 1,
            failureReason: null,
            createdAt: new Date('2026-04-27T10:00:00Z'),
            updatedAt: new Date('2026-04-27T10:01:00Z'),
            finishedAt: null,
          },
          {
            id: 'job-2',
            queueName: 'optimization',
            jobType: 'optimization',
            resourceType: 'shopping_list',
            resourceId: 'list-2',
            status: 'failed',
            attemptCount: 3,
            failureReason: 'boom',
            createdAt: new Date('2026-04-27T09:00:00Z'),
            updatedAt: new Date('2026-04-27T09:01:00Z'),
            finishedAt: new Date('2026-04-27T09:01:00Z'),
          },
          {
            id: 'job-3',
            queueName: 'receipt-processing',
            jobType: 'receipt_processing',
            resourceType: 'receipt',
            resourceId: 'receipt-1',
            status: 'retrying',
            attemptCount: 2,
            failureReason: 'timeout',
            createdAt: new Date('2026-04-27T08:00:00Z'),
            updatedAt: new Date('2026-04-27T08:01:00Z'),
            finishedAt: null,
          },
        ]),
      },
      shoppingList: {
        count: jest.fn().mockResolvedValue(24),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'list-1',
            name: 'Compra mensal',
            status: 'ready',
            updatedAt: new Date('2026-04-27T10:05:00Z'),
            user: {
              id: 'user-1',
              displayName: 'Cliente 1',
              email: 'cliente1@pricely.local',
            },
            preferredRegion: {
              id: 'region-1',
              name: 'Sao Paulo',
              stateCode: 'SP',
            },
            shoppingListItems: [{ id: 'item-1' }, { id: 'item-2' }],
            optimizationRuns: [
              {
                id: 'run-1',
                mode: 'global_full',
                status: 'completed',
                estimatedSavings: { toString: () => '18.50' },
                totalEstimatedCost: { toString: () => '82.40' },
                coverageStatus: 'complete',
                createdAt: new Date('2026-04-27T10:04:00Z'),
                completedAt: new Date('2026-04-27T10:05:00Z'),
              },
            ],
          },
        ]),
      },
    };

    const service = new AdminDashboardService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getMetrics()).resolves.toEqual({
      activeUsers: 12,
      shoppingListsCount: 24,
      optimizationRunsCount: 18,
      activeRegions: 3,
      activeEstablishments: 17,
      activeOffers: 42,
      productCount: 11,
      queuedJobs: 5,
      globalEstimatedSavings: 321.45,
    });

    await expect(service.listProcessingJobs()).resolves.toEqual([
      expect.objectContaining({
        id: 'job-1',
        queueName: 'optimization',
        status: 'queued',
        createdAt: '2026-04-27T10:00:00.000Z',
      }),
      expect.objectContaining({
        id: 'job-2',
        status: 'failed',
        finishedAt: '2026-04-27T09:01:00.000Z',
      }),
      expect.objectContaining({
        id: 'job-3',
        status: 'retrying',
        failureReason: 'timeout',
      }),
    ]);

    await expect(service.getQueueHealth()).resolves.toEqual({
      queuedJobs: 2,
      runningJobs: 0,
      failedJobs: 1,
      completedJobs: 0,
      jobsByStatus: {
        queued: 1,
        failed: 1,
        retrying: 1,
      },
      queues: ['optimization', 'receipt-processing'],
      recentFailures: [
        {
          queueName: 'optimization',
          status: 'failed',
          failureReason: 'boom',
        },
        {
          queueName: 'receipt-processing',
          status: 'retrying',
          failureReason: 'timeout',
        },
      ],
    });

    await expect(service.listShoppingListAudits()).resolves.toEqual([
      expect.objectContaining({
        id: 'list-1',
        name: 'Compra mensal',
        itemCount: 2,
        owner: expect.objectContaining({
          id: 'user-1',
          displayName: 'Cliente 1',
        }),
        city: 'Sao Paulo - SP',
        latestOptimization: expect.objectContaining({
          id: 'run-1',
          mode: 'global_full',
          status: 'completed',
          estimatedSavings: 18.5,
          totalEstimatedCost: 82.4,
          coverageStatus: 'complete',
        }),
      }),
    ]);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin metrics generated'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin processing jobs requested'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin queue health generated'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin shopping list audit requested'),
    );
  });

  it('persists region activation changes through the admin mutation surface', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {};
    const regionsAdminService = {
      create: jest.fn().mockResolvedValue({
        id: 'region-1',
        slug: 'campinas-sp',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'region-1',
        implantationStatus: 'active',
      }),
    };

    const service = new AdminDashboardService(
      prisma as never,
      regionsAdminService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.createRegion({
      slug: 'campinas-sp',
      name: 'Campinas',
      stateCode: 'SP',
      implantationStatus: 'activating',
    });
    await service.updateRegion('region-1', {
      implantationStatus: 'active',
    });

    expect(regionsAdminService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'campinas-sp',
        implantationStatus: 'activating',
      }),
    );
    expect(regionsAdminService.update).toHaveBeenCalledWith('region-1', {
      implantationStatus: 'active',
    });
    expect(logSpy).toHaveBeenCalledWith('Admin created region campinas-sp (region-1)');
    expect(logSpy).toHaveBeenCalledWith('Admin updated region region-1');
  });
});
