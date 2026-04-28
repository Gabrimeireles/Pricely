import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';
import { type OptimizationRunEntity } from '../domain/optimization-run.entity';

@Injectable()
export class OptimizationRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createQueuedRun(input: {
    shoppingListId: string;
    userId: string;
    mode: 'local' | 'global_unique' | 'global_full';
    regionId: string;
    preferredEstablishmentId?: string | null;
    jobId: string;
  }): Promise<OptimizationRunEntity> {
    const record = await this.prisma.optimizationRun.create({
      data: {
        shoppingListId: input.shoppingListId,
        userId: input.userId,
        mode: input.mode,
        regionId: input.regionId,
        preferredEstablishmentId: input.preferredEstablishmentId ?? null,
        jobId: input.jobId,
        status: 'queued',
        coverageStatus: 'none',
      },
    });

    return this.toEntity(record);
  }

  async findLatestForUser(
    userId: string,
    shoppingListId: string,
  ) {
    return this.prisma.optimizationRun.findFirst({
      where: {
        shoppingListId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        optimizationSelections: {
          include: {
            shoppingListItem: true,
            productOffer: {
              include: {
                establishment: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.optimizationRun.findUnique({
      where: { id },
    });
  }

  private toEntity(record: {
    id: string;
    shoppingListId: string;
    userId: string;
    mode: 'local' | 'global_unique' | 'global_full';
    regionId: string;
    preferredEstablishmentId: string | null;
    jobId: string | null;
    status: 'queued' | 'running' | 'completed' | 'failed';
    coverageStatus: 'complete' | 'partial' | 'none';
    totalEstimatedCost: { toString(): string } | null;
    estimatedSavings: { toString(): string } | null;
    summary: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }): OptimizationRunEntity {
    return {
      id: record.id,
      shoppingListId: record.shoppingListId,
      userId: record.userId,
      mode: record.mode,
      regionId: record.regionId,
      preferredEstablishmentId: record.preferredEstablishmentId,
      jobId: record.jobId,
      status: record.status,
      coverageStatus: record.coverageStatus,
      totalEstimatedCost:
        record.totalEstimatedCost !== null ? Number(record.totalEstimatedCost) : undefined,
      estimatedSavings:
        record.estimatedSavings !== null ? Number(record.estimatedSavings) : undefined,
      summary: record.summary ?? undefined,
      createdAt: record.createdAt.toISOString(),
      completedAt: record.completedAt?.toISOString(),
    };
  }
}
