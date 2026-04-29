import { ProcessingJobsService } from '../../../src/processing/application/processing-jobs.service';

describe('ProcessingJobsService', () => {
  it('marks jobs through queued, running, retrying, completed, and failed transitions', async () => {
    const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];
    const prisma = {
      processingJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
        update: jest.fn().mockImplementation(async (input) => {
          updates.push(input);
          return { id: input.where.id, ...input.data };
        }),
      },
    } as any;

    const service = new ProcessingJobsService(prisma);

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
});
