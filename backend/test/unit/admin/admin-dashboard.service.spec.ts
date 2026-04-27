import { Logger } from '@nestjs/common';

import { AdminDashboardService } from '../../../src/admin/application/admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('aggregates metrics, queue health, and processing job projections', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      userAccount: { count: jest.fn().mockResolvedValue(12) },
      shoppingList: { count: jest.fn().mockResolvedValue(24) },
      optimizationRun: { count: jest.fn().mockResolvedValue(18) },
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
    };

    const service = new AdminDashboardService(prisma as never);

    await expect(service.getMetrics()).resolves.toEqual({
      activeUsers: 12,
      shoppingListsCount: 24,
      optimizationRunsCount: 18,
      activeRegions: 3,
      activeEstablishments: 17,
      activeOffers: 42,
      productCount: 11,
      queuedJobs: 5,
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

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin metrics generated'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin processing jobs requested'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin queue health generated'),
    );
  });

  it('persists region activation changes through the admin mutation surface', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      region: {
        create: jest.fn().mockResolvedValue({
          id: 'region-1',
          slug: 'campinas-sp',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'region-1',
          implantationStatus: 'active',
        }),
      },
    };

    const service = new AdminDashboardService(prisma as never);

    await service.createRegion({
      slug: 'campinas-sp',
      name: 'Campinas',
      stateCode: 'SP',
      implantationStatus: 'activating',
    });
    await service.updateRegion('region-1', {
      implantationStatus: 'active',
    });

    expect(prisma.region.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'campinas-sp',
        implantationStatus: 'activating',
      }),
    });
    expect(prisma.region.update).toHaveBeenCalledWith({
      where: { id: 'region-1' },
      data: { implantationStatus: 'active' },
    });
    expect(logSpy).toHaveBeenCalledWith('Admin created region campinas-sp (region-1)');
    expect(logSpy).toHaveBeenCalledWith('Admin updated region region-1');
  });
});
