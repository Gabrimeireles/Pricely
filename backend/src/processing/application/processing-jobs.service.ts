import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class ProcessingJobsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
