import { ProcessingJobsService } from '../../../src/processing/application/processing-jobs.service';

describe('ProcessingJobsService', () => {
  it('marks jobs through queued, running, retrying, completed, and failed transitions', async () => {
    const updates: Array<{
      where: { id: string };
      data: Record<string, unknown>;
    }> = [];
    const prisma = {
      processingJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
        update: jest.fn().mockImplementation(async (input) => {
          updates.push(input);
          return { id: input.where.id, ...input.data };
        }),
      },
      optimizationRun: {
        updateMany: jest.fn(),
      },
    } as any;

    const service = new ProcessingJobsService(
      prisma,
      { add: jest.fn(), getJobs: jest.fn().mockResolvedValue([]) } as any,
      { add: jest.fn(), getJobs: jest.fn().mockResolvedValue([]) } as any,
    );

    const created = await service.createQueuedJob({
      queueName: 'optimization',
      jobType: 'optimization',
      resourceType: 'shopping_list',
      resourceId: 'list-1',
    });

    expect(created.id).toBe('job-1');

    await service.markRunning('job-1');
    await service.markRetrying('job-1', 'temporary failure');
    await service.markCompleted('job-1');
    await service.markFailed('job-1', 'terminal failure');

    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'running',
            failureReason: null,
          }),
        }),
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'retrying',
            failureReason: 'temporary failure',
          }),
        }),
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'completed',
            failureReason: null,
          }),
        }),
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'failed',
            failureReason: 'terminal failure',
          }),
        }),
      ]),
    );
  });

  it('requeues failed optimization jobs with the persisted run payload', async () => {
    const optimizationQueue = { add: jest.fn() };
    const prisma = {
      processingJob: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'job-1',
            status: 'failed',
            jobType: 'optimization',
            optimizationRun: { id: 'run-1', shoppingListId: 'list-1' },
            receiptRecord: null,
          })
          .mockResolvedValueOnce({ id: 'job-1', status: 'queued' }),
        update: jest.fn().mockResolvedValue({ id: 'job-1', status: 'queued' }),
      },
      optimizationRun: {
        update: jest.fn().mockResolvedValue({ id: 'run-1' }),
      },
    } as any;
    const service = new ProcessingJobsService(
      prisma,
      optimizationQueue as any,
      { add: jest.fn(), getJobs: jest.fn() } as any,
    );

    await service.retry('job-1');

    expect(optimizationQueue.add).toHaveBeenCalledWith(
      'optimization-admin-retry',
      {
        shoppingListId: 'list-1',
        optimizationRunId: 'run-1',
        processingJobId: 'job-1',
      },
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('cancels only queued jobs and removes their BullMQ entry', async () => {
    const remove = jest.fn();
    const optimizationQueue = {
      getJobs: jest
        .fn()
        .mockResolvedValue([{ data: { processingJobId: 'job-1' }, remove }]),
    };
    const prisma = {
      processingJob: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          status: 'queued',
          jobType: 'optimization',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'job-1',
          status: 'cancelled',
        }),
      },
      optimizationRun: {
        updateMany: jest.fn(),
      },
    } as any;
    const service = new ProcessingJobsService(
      prisma,
      optimizationQueue as any,
      { getJobs: jest.fn() } as any,
    );

    await service.cancel('job-1', 'admin-1', 'Dados invalidos');

    expect(remove).toHaveBeenCalled();
    expect(prisma.processingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          cancelledByUserId: 'admin-1',
        }),
      }),
    );
  });
});
