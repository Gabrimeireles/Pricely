import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Queue } from 'bullmq';

import {
  OPTIMIZATION_QUEUE,
  type OptimizationJob,
  RECEIPT_PROCESSING_QUEUE,
  type ReceiptProcessingJob,
} from '../../common/queue/queue.tokens';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class ProcessingJobsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OPTIMIZATION_QUEUE)
    private readonly optimizationQueue: Queue<OptimizationJob>,
    @Inject(RECEIPT_PROCESSING_QUEUE)
    private readonly receiptQueue: Queue<ReceiptProcessingJob>,
  ) {}

  async createQueuedJob(input: {
    queueName: string;
    jobType: 'optimization' | 'receipt_processing';
    resourceType: string;
    resourceId: string;
  }) {
    return this.prisma.processingJob.create({
      data: {
        queueName: input.queueName,
        jobType: input.jobType,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        status: 'queued',
      },
    });
  }

  async markRunning(jobId: string) {
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        attemptCount: {
          increment: 1,
        },
        failureReason: null,
      },
    });
  }

  async markQueued(jobId: string) {
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'queued',
        failureReason: null,
        finishedAt: null,
      },
    });
  }

  async markRetrying(jobId: string, reason?: string) {
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'retrying',
        failureReason: reason?.slice(0, 1000) ?? null,
      },
    });
  }

  async markCompleted(jobId: string) {
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        failureReason: null,
      },
    });
  }

  async markFailed(jobId: string, reason?: string) {
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        failureReason: reason?.slice(0, 1000) ?? null,
      },
    });
  }

  async retry(jobId: string) {
    const job = await this.prisma.processingJob.findUnique({
      where: { id: jobId },
      include: {
        optimizationRun: {
          select: { id: true, shoppingListId: true },
        },
        receiptRecord: {
          select: { id: true },
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Job nao encontrado');
    }
    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new BadRequestException(
        'Somente jobs com falha ou cancelados podem ser reenfileirados',
      );
    }

    await this.markQueued(job.id);
    if (job.jobType === 'optimization' && job.optimizationRun) {
      await this.prisma.optimizationRun.update({
        where: { id: job.optimizationRun.id },
        data: { status: 'queued', completedAt: null },
      });
      await this.optimizationQueue.add(
        'optimization-admin-retry',
        {
          shoppingListId: job.optimizationRun.shoppingListId,
          optimizationRunId: job.optimizationRun.id,
          processingJobId: job.id,
        },
        this.queueOptions(),
      );
      return this.getById(job.id);
    }
    if (job.jobType === 'receipt_processing' && job.receiptRecord) {
      await this.receiptQueue.add(
        'receipt-processing-admin-retry',
        {
          receiptRecordId: job.receiptRecord.id,
          processingJobId: job.id,
        },
        this.queueOptions(),
      );
      return this.getById(job.id);
    }
    throw new BadRequestException('Job nao possui recurso reenfileiravel');
  }

  async markReviewed(jobId: string, adminUserId: string) {
    await this.requireJob(jobId);
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        reviewedAt: new Date(),
        reviewedByUserId: adminUserId,
      },
    });
  }

  async cancel(jobId: string, adminUserId: string, reason?: string) {
    const job = await this.requireJob(jobId);
    if (job.status !== 'queued' && job.status !== 'retrying') {
      throw new BadRequestException(
        'Somente jobs aguardando execucao podem ser cancelados',
      );
    }

    const queue =
      job.jobType === 'optimization'
        ? this.optimizationQueue
        : this.receiptQueue;
    const queuedJobs = await queue.getJobs(['waiting', 'delayed', 'paused']);
    const queuedJob = queuedJobs.find(
      (entry) =>
        (entry.data as { processingJobId?: string }).processingJobId === jobId,
    );
    if (queuedJob) {
      await queuedJob.remove();
    }
    if (job.jobType === 'optimization') {
      await this.prisma.optimizationRun.updateMany({
        where: { jobId },
        data: {
          status: 'failed',
          summary: 'Processamento cancelado pela operacao administrativa.',
          completedAt: new Date(),
        },
      });
    }
    return this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledByUserId: adminUserId,
        cancellationReason: reason?.trim().slice(0, 500) || 'admin_cancelled',
        finishedAt: new Date(),
      },
    });
  }

  private getById(jobId: string) {
    return this.prisma.processingJob.findUnique({
      where: { id: jobId },
    });
  }

  private async requireJob(jobId: string) {
    const job = await this.prisma.processingJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job nao encontrado');
    }
    return job;
  }

  private queueOptions() {
    return {
      attempts: 3,
      backoff: {
        type: 'fixed' as const,
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    };
  }
}
