import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Queue } from 'bullmq';

import {
  type OptimizationExplanationPayload,
  type OptimizationMode,
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
import { EntitlementsService } from '../../users/entitlements.service';
import { OptimizationRunRepository } from '../infrastructure/optimization-run.repository';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class OptimizationResultService {
  private readonly logger = new Logger(OptimizationResultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shoppingListsService: ShoppingListsService,
    private readonly entitlementsService: EntitlementsService,
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
    const shoppingList = await this.shoppingListsService.getById(
      userId,
      shoppingListId,
    );
    await this.entitlementsService.ensureOptimizationAllowed(userId);

    const regionId =
      (await this.resolveRegionId(request.regionId)) ??
      (await this.resolveRegionId(shoppingList.preferredRegionId)) ??
      (await this.resolveDefaultRegionId());

    if (!regionId) {
      throw new NotFoundException(
        'No active region is available yet for this optimization request',
      );
    }

    const mode = this.normalizeMode(request.mode);

    const processingJob = await this.processingJobsService.createQueuedJob({
      queueName: 'optimization',
      jobType: 'optimization',
      resourceType: 'shopping_list',
      resourceId: shoppingListId,
    });

    const optimizationRun =
      await this.optimizationRunRepository.createQueuedRun({
        shoppingListId,
        userId,
        mode,
        regionId,
        preferredEstablishmentId: request.preferredEstablishmentId ?? null,
        jobId: processingJob.id,
      });
    await this.entitlementsService.consumeOptimizationToken({
      userId,
      optimizationRunId: optimizationRun.id,
    });

    await this.optimizationQueue.add(
      'optimization-generated',
      {
        shoppingListId,
        optimizationRunId: optimizationRun.id,
        processingJobId: processingJob.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    this.logger.log(
      `Optimization run ${optimizationRun.id} queued for shopping list ${shoppingListId}`,
    );

    return {
      id: optimizationRun.id,
      jobId: processingJob.id,
      shoppingListId,
      mode,
      status: 'queued',
      queuedAt: optimizationRun.createdAt,
    };
  }

  private normalizeMode(mode: OptimizeShoppingListRequest['mode']): OptimizationMode {
    const aliases: Record<string, OptimizationMode> = {
      local_unique: 'local',
      local_multi: 'global_unique',
      global_multi: 'global_full',
    };

    return aliases[mode] ?? (mode as OptimizationMode);
  }

  async getLatest(
    userId: string,
    shoppingListId: string,
  ): Promise<OptimizationResult> {
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

    const trustSnapshots = this.getSelectionTrustSnapshots(
      latest.explanationPayload as OptimizationExplanationPayload | null,
    );

    return {
      id: latest.id,
      shoppingListId: latest.shoppingListId,
      mode: latest.mode,
      status: latest.status,
      totalEstimatedCost:
        latest.totalEstimatedCost !== null
          ? Number(latest.totalEstimatedCost)
          : undefined,
      estimatedSavings:
        latest.estimatedSavings !== null
          ? Number(latest.estimatedSavings)
          : undefined,
      coverageStatus: latest.coverageStatus,
      explanationSummary: latest.summary ?? undefined,
      explanationPayload:
        (latest.explanationPayload as OptimizationExplanationPayload | null) ??
        undefined,
      createdAt: latest.createdAt.toISOString(),
      completedAt: latest.completedAt?.toISOString(),
      selections: latest.optimizationSelections.map((selection) => {
        const trustSnapshot = trustSnapshots.get(
          this.selectionTrustSnapshotKey(
            selection.shoppingListItemId,
            selection.productOfferId ?? undefined,
          ),
        );

        return {
          id: selection.id,
          shoppingListItemId: selection.shoppingListItemId,
          productOfferId: selection.productOfferId ?? undefined,
          shoppingListItemName: selection.shoppingListItem.requestedName,
          selectedOfferName: selection.productOffer?.displayName,
          selectedVariantName:
            selection.productOffer?.productVariant?.displayName,
          selectedPackageLabel:
            selection.productOffer?.productVariant?.packageLabel ??
            selection.productOffer?.packageLabel,
          establishmentName: selection.productOffer?.establishment.unitName,
          establishmentNeighborhood:
            selection.productOffer?.establishment.neighborhood,
          estimatedCost:
            selection.estimatedCost !== null
              ? Number(selection.estimatedCost)
              : undefined,
          priceAmount:
            selection.productOffer?.priceAmount !== undefined
              ? Number(selection.productOffer.priceAmount)
              : undefined,
          comparisonPriceAmount:
            selection.comparisonPriceAmount !== null
              ? Number(selection.comparisonPriceAmount)
              : undefined,
          regionalAveragePriceAmount:
            selection.regionalAveragePriceAmount !== null
              ? Number(selection.regionalAveragePriceAmount)
              : undefined,
          savingsVsComparison:
            selection.savingsVsComparison !== null
              ? Number(selection.savingsVsComparison)
              : undefined,
          sourceLabel: selection.productOffer?.sourceReference ?? undefined,
          observedAt: selection.productOffer?.observedAt.toISOString(),
          trustFactor: trustSnapshot?.trustFactor,
          trustLevel: trustSnapshot?.trustLevel,
          trustEvidenceCount: trustSnapshot?.trustEvidenceCount,
          trustFreshnessDays: trustSnapshot?.trustFreshnessDays,
          trustLastValidatedAt: trustSnapshot?.trustLastValidatedAt,
          trustExplanation: trustSnapshot?.trustExplanation,
          selectionStatus:
            selection.status === 'selected'
              ? 'selected'
              : selection.status === 'missing'
                ? 'missing'
                : 'review',
          confidenceNotice: selection.confidenceNotice ?? undefined,
          decisionReason: selection.confidenceNotice
            ? 'selected_with_data_quality_warning'
            : selection.status === 'selected'
              ? 'selected_confirmed_offer'
              : 'not_selected',
          rejectedReason:
            selection.status === 'missing'
              ? 'no_confirmed_offer_available'
              : undefined,
        };
      }),
    };
  }

  private getSelectionTrustSnapshots(
    explanationPayload?: OptimizationExplanationPayload | null,
  ) {
    return new Map(
      (explanationPayload?.selectedOffers ?? []).map((offer) => [
        this.selectionTrustSnapshotKey(
          offer.shoppingListItemId,
          offer.productOfferId,
        ),
        {
          trustFactor: offer.trustFactor,
          trustLevel: offer.trustLevel,
          trustEvidenceCount: offer.trustEvidenceCount,
          trustFreshnessDays: offer.trustFreshnessDays,
          trustLastValidatedAt: offer.trustLastValidatedAt,
          trustExplanation: offer.trustExplanation,
        },
      ]),
    );
  }

  private selectionTrustSnapshotKey(
    shoppingListItemId: string,
    productOfferId?: string,
  ): string {
    return `${shoppingListItemId}:${productOfferId ?? 'none'}`;
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

  private async resolveRegionId(
    regionReference?: string,
  ): Promise<string | null> {
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
