import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Queue } from 'bullmq';

import {
  type OptimizationRunAccepted,
  type OptimizeShoppingListRequest,
  type OptimizationResult,
} from '../../common/contracts';
import {
  OPTIMIZATION_QUEUE,
  type OptimizationJob,
} from '../../common/queue/queue.tokens';
import { ProcessingJobsService } from '../../processing/application/processing-jobs.service';
import { PrismaService } from '../../persistence/prisma.service';
import { ShoppingListsService } from '../../lists/application/shopping-lists.service';
import { OptimizationRunRepository } from '../infrastructure/optimization-run.repository';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class OptimizationResultService {
  private readonly logger = new Logger(OptimizationResultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shoppingListsService: ShoppingListsService,
    private readonly processingJobsService: ProcessingJobsService,
    private readonly optimizationRunRepository: OptimizationRunRepository,
    @Inject(OPTIMIZATION_QUEUE)
    private readonly optimizationQueue: Queue<OptimizationJob>,
  ) {}

  async optimize(
    userId: string,
    shoppingListId: string,
    request: OptimizeShoppingListRequest,
  ): Promise<OptimizationRunAccepted> {
    return this.createOptimizationRun(userId, shoppingListId, request);
  }

  async createOptimizationRun(
    userId: string,
    shoppingListId: string,
    request: OptimizeShoppingListRequest,
  ): Promise<OptimizationRunAccepted> {
    const shoppingList = await this.shoppingListsService.getById(userId, shoppingListId);

    const regionId =
      (await this.resolveRegionId(request.regionId)) ??
      (await this.resolveRegionId(shoppingList.preferredRegionId)) ??
      (await this.resolveDefaultRegionId());

    if (!regionId) {
      throw new NotFoundException(
        'No active region is available yet for this optimization request',
      );
    }

    const processingJob = await this.processingJobsService.createQueuedJob({
      queueName: 'optimization',
      jobType: 'optimization',
      resourceType: 'shopping_list',
      resourceId: shoppingListId,
    });

    const optimizationRun = await this.optimizationRunRepository.createQueuedRun({
      shoppingListId,
      userId,
      mode: request.mode,
      regionId,
      preferredEstablishmentId: request.preferredEstablishmentId ?? null,
      jobId: processingJob.id,
    });

    await this.optimizationQueue.add('optimization-generated', {
      shoppingListId,
      optimizationRunId: optimizationRun.id,
      processingJobId: processingJob.id,
    }, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(
      `Optimization run ${optimizationRun.id} queued for shopping list ${shoppingListId}`,
    );

    return {
      id: optimizationRun.id,
      jobId: processingJob.id,
      shoppingListId,
      mode: request.mode,
      status: 'queued',
      queuedAt: optimizationRun.createdAt,
    };
  }

  async getLatest(userId: string, shoppingListId: string): Promise<OptimizationResult> {
    const latest = await this.optimizationRunRepository.findLatestForUser(
      userId,
      shoppingListId,
    );

    if (!latest) {
      throw new NotFoundException(
        `No optimization result found for shopping list ${shoppingListId}`,
      );
    }

    this.logger.log(
      `Returned optimization run ${latest.id} with status ${latest.status} for shopping list ${shoppingListId}`,
    );

    return {
      id: latest.id,
      shoppingListId: latest.shoppingListId,
      mode: latest.mode,
      status: latest.status,
      totalEstimatedCost:
        latest.totalEstimatedCost !== null ? Number(latest.totalEstimatedCost) : undefined,
      estimatedSavings:
        latest.estimatedSavings !== null ? Number(latest.estimatedSavings) : undefined,
      coverageStatus: latest.coverageStatus,
      explanationSummary: latest.summary ?? undefined,
      createdAt: latest.createdAt.toISOString(),
      completedAt: latest.completedAt?.toISOString(),
      selections: latest.optimizationSelections.map((selection) => ({
        id: selection.id,
        shoppingListItemId: selection.shoppingListItemId,
        productOfferId: selection.productOfferId ?? undefined,
        shoppingListItemName: selection.shoppingListItem.requestedName,
        establishmentName: selection.productOffer?.establishment.unitName,
        establishmentNeighborhood: selection.productOffer?.establishment.neighborhood,
        estimatedCost:
          selection.estimatedCost !== null ? Number(selection.estimatedCost) : undefined,
        priceAmount:
          selection.productOffer?.priceAmount !== undefined
            ? Number(selection.productOffer.priceAmount)
            : undefined,
        sourceLabel: selection.productOffer?.sourceReference ?? undefined,
        observedAt: selection.productOffer?.observedAt.toISOString(),
        selectionStatus:
          selection.status === 'selected'
            ? 'selected'
            : selection.status === 'missing'
              ? 'missing'
              : 'review',
        confidenceNotice: selection.confidenceNotice ?? undefined,
      })),
    };
  }

  private async resolveDefaultRegionId(): Promise<string | null> {
    const region = await this.prisma.region.findFirst({
      where: {
        implantationStatus: {
          not: 'inactive',
        },
      },
      orderBy: {
        publicSortOrder: 'asc',
      },
    });

    return region?.id ?? null;
  }

  private async resolveRegionId(regionReference?: string): Promise<string | null> {
    if (!regionReference) {
      return null;
    }

    if (UUID_PATTERN.test(regionReference)) {
      const directMatch = await this.prisma.region.findUnique({
        where: { id: regionReference },
        select: { id: true },
      });

      if (directMatch) {
        return directMatch.id;
      }
    }

    const slugMatch = await this.prisma.region.findUnique({
      where: { slug: regionReference },
      select: { id: true },
    });

    return slugMatch?.id ?? null;
  }
}
