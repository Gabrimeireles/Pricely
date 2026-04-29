import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { type ConnectionOptions, Worker } from 'bullmq';

import { QUEUE_CONNECTION } from '../common/queue/queue.config';
import { type OptimizationJob } from '../common/queue/queue.tokens';
import { ProcessingJobsService } from '../processing/application/processing-jobs.service';
import { PrismaService } from '../persistence/prisma.service';
import { OptimizationRunProcessor } from './optimization-run.processor';

@Injectable()
export class OptimizationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OptimizationWorkerService.name);
  private worker: Worker<OptimizationJob> | null = null;

  constructor(
    @Inject(QUEUE_CONNECTION)
    private readonly connection: ConnectionOptions,
    private readonly prisma: PrismaService,
    private readonly processingJobsService: ProcessingJobsService,
    private readonly optimizationRunProcessor: OptimizationRunProcessor,
  ) {}

  onModuleInit() {
    if (process.env.JEST_WORKER_ID || process.env.QUEUE_WORKERS_ENABLED === 'false') {
      this.logger.log('Optimization worker bootstrap skipped for test or disabled environment');
      return;
    }

    this.worker = new Worker<OptimizationJob>(
      'optimization',
      async (job) => {
        this.logger.log(
          `Starting optimization job ${job.id} for run ${job.data.optimizationRunId} attempt ${job.attemptsMade + 1}`,
        );
        await this.processingJobsService.markRunning(job.data.processingJobId);
        await this.prisma.optimizationRun.update({
          where: {
            id: job.data.optimizationRunId,
          },
          data: {
            status: 'running',
          },
        });

        await this.optimizationRunProcessor.process(job.data.optimizationRunId);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', async (job) => {
      this.logger.log(
        `Completed optimization job ${job.id} for run ${job.data.optimizationRunId}`,
      );
      await this.processingJobsService.markCompleted(job.data.processingJobId);
    });

    this.worker.on('failed', async (job, error) => {
      if (!job) {
        return;
      }

      const maxAttempts = job.opts.attempts ?? 1;
      const message = error?.message ?? 'Optimization job failed';

      if (job.attemptsMade < maxAttempts) {
        this.logger.warn(
          `Retrying optimization job ${job.id} for run ${job.data.optimizationRunId}: ${message}`,
        );
        await this.processingJobsService.markRetrying(job.data.processingJobId, message);
        await this.prisma.optimizationRun.update({
          where: {
            id: job.data.optimizationRunId,
          },
          data: {
            status: 'queued',
          },
        });
        return;
      }

      await this.processingJobsService.markFailed(job.data.processingJobId, message);
      await this.prisma.optimizationRun.update({
        where: {
          id: job.data.optimizationRunId,
        },
        data: {
          status: 'failed',
          summary: message,
        },
      });
      this.logger.error(
        `Optimization worker failed for run ${job.data.optimizationRunId} after ${job.attemptsMade} attempts: ${message}`,
      );
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
