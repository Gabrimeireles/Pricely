import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { type ConnectionOptions, Worker } from 'bullmq';

import { QUEUE_CONNECTION } from '../common/queue/queue.config';
import { type ReceiptProcessingJob } from '../common/queue/queue.tokens';
import { ProcessingJobsService } from '../processing/application/processing-jobs.service';
import { ReceiptIngestionProcessor } from './receipt-ingestion.processor';

@Injectable()
export class ReceiptWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReceiptWorkerService.name);
  private worker: Worker<ReceiptProcessingJob> | null = null;

  constructor(
    @Inject(QUEUE_CONNECTION)
    private readonly connection: ConnectionOptions,
    private readonly processingJobsService: ProcessingJobsService,
    private readonly receiptIngestionProcessor: ReceiptIngestionProcessor,
  ) {}

  onModuleInit() {
    if (process.env.JEST_WORKER_ID || process.env.QUEUE_WORKERS_ENABLED === 'false') {
      this.logger.log('Receipt worker bootstrap skipped for test or disabled environment');
      return;
    }

    this.worker = new Worker<ReceiptProcessingJob>(
      'receipt-processing',
      async (job) => {
        this.logger.log(
          `Starting receipt job ${job.id} for record ${job.data.receiptRecordId} attempt ${job.attemptsMade + 1}`,
        );
        await this.processingJobsService.markRunning(job.data.processingJobId);
        await this.receiptIngestionProcessor.process(job.data.receiptRecordId);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', async (job) => {
      this.logger.log(`Completed receipt job ${job.id} for record ${job.data.receiptRecordId}`);
      await this.processingJobsService.markCompleted(job.data.processingJobId);
    });

    this.worker.on('failed', async (job, error) => {
      if (!job) {
        return;
      }

      const maxAttempts = job.opts.attempts ?? 1;
      const message = error?.message ?? 'Receipt processing job failed';

      if (job.attemptsMade < maxAttempts) {
        this.logger.warn(
          `Retrying receipt job ${job.id} for record ${job.data.receiptRecordId}: ${message}`,
        );
        await this.processingJobsService.markRetrying(job.data.processingJobId, message);
        return;
      }

      await this.processingJobsService.markFailed(job.data.processingJobId, message);
      this.logger.error(
        `Receipt worker failed for record ${job.data.receiptRecordId}: ${message}`,
      );
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
