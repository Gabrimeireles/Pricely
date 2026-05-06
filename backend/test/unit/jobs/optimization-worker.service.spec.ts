jest.mock('bullmq', () => {
  const workers: any[] = [];

  class WorkerMock {
    public readonly handlers = new Map<string, (...args: any[]) => unknown>();

    constructor(
      public readonly queueName: string,
      public readonly processor: (job: any) => Promise<unknown>,
      public readonly options: unknown,
    ) {
      workers.push(this);
    }

    on(event: string, handler: (...args: any[]) => unknown) {
      this.handlers.set(event, handler);
      return this;
    }

    async close() {
      return undefined;
    }
  }

  return {
    Worker: WorkerMock,
    __workers: workers,
  };
});

import { OptimizationWorkerService } from '../../../src/jobs/optimization-worker.service';

describe('OptimizationWorkerService', () => {
  const bullmq = jest.requireMock('bullmq') as { __workers: any[] };

  beforeEach(() => {
    bullmq.__workers.length = 0;
    delete process.env.JEST_WORKER_ID;
    delete process.env.QUEUE_WORKERS_ENABLED;
  });

  it('marks a failed job as retrying before the final attempt and failed after the final attempt', async () => {
    const processingJobsService = {
      markRunning: jest.fn(),
      markCompleted: jest.fn(),
      markRetrying: jest.fn(),
      markFailed: jest.fn(),
    };
    const prisma = {
      optimizationRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'run-1',
          userId: 'user-1',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    const entitlementsService = {
      refundOptimizationToken: jest.fn().mockResolvedValue(undefined),
    };
    const optimizationRunProcessor = {
      process: jest.fn().mockResolvedValue(undefined),
    };

    const service = new OptimizationWorkerService(
      {} as never,
      prisma as never,
      entitlementsService as never,
      processingJobsService as never,
      optimizationRunProcessor as never,
    );

    service.onModuleInit();

    const worker = bullmq.__workers[0];
    expect(worker).toBeDefined();

    const job = {
      id: 'job-1',
      attemptsMade: 1,
      opts: { attempts: 3 },
      data: {
        processingJobId: 'processing-1',
        optimizationRunId: 'run-1',
      },
    };

    await worker.handlers.get('failed')(job, new Error('temporary'));

    expect(processingJobsService.markRetrying).toHaveBeenCalledWith(
      'processing-1',
      'temporary',
    );
    expect(prisma.optimizationRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: { status: 'queued' },
    });

    await worker.handlers.get('failed')(
      { ...job, attemptsMade: 3, opts: { attempts: 3 } },
      new Error('fatal'),
    );

    expect(processingJobsService.markFailed).toHaveBeenCalledWith(
      'processing-1',
      'fatal',
    );
    expect(prisma.optimizationRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: { status: 'failed', summary: 'fatal' },
    });
    expect(entitlementsService.refundOptimizationToken).toHaveBeenCalledWith({
      userId: 'user-1',
      optimizationRunId: 'run-1',
      reason: 'optimization_failed',
    });
  });

  it('marks running and completed transitions around worker execution', async () => {
    const processingJobsService = {
      markRunning: jest.fn().mockResolvedValue(undefined),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markRetrying: jest.fn(),
      markFailed: jest.fn(),
    };
    const prisma = {
      optimizationRun: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    const entitlementsService = {
      refundOptimizationToken: jest.fn(),
    };
    const optimizationRunProcessor = {
      process: jest.fn().mockResolvedValue(undefined),
    };

    const service = new OptimizationWorkerService(
      {} as never,
      prisma as never,
      entitlementsService as never,
      processingJobsService as never,
      optimizationRunProcessor as never,
    );

    service.onModuleInit();

    const worker = bullmq.__workers[0];
    const job = {
      id: 'job-2',
      attemptsMade: 0,
      opts: { attempts: 3 },
      data: {
        processingJobId: 'processing-2',
        optimizationRunId: 'run-2',
      },
    };

    await worker.processor(job);
    expect(processingJobsService.markRunning).toHaveBeenCalledWith('processing-2');
    expect(prisma.optimizationRun.update).toHaveBeenCalledWith({
      where: { id: 'run-2' },
      data: { status: 'running' },
    });
    expect(optimizationRunProcessor.process).toHaveBeenCalledWith('run-2');

    await worker.handlers.get('completed')(job);
    expect(processingJobsService.markCompleted).toHaveBeenCalledWith('processing-2');
  });
});
