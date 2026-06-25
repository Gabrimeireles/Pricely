import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ShoppingListsService } from '../lists/application/shopping-lists.service';
import { MultiMarketOptimizerService } from '../optimization/domain/multi-market-optimizer.service';
import { PrismaService } from '../persistence/prisma.service';
import { StoreOfferRepository } from '../stores/infrastructure/store-offer.repository';
import { type StoreOfferEntity } from '../stores/domain/store-offer.entity';
import { OptimizationRunRepository } from '../optimization/infrastructure/optimization-run.repository';
import { EntitlementsService } from '../users/entitlements.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OptimizationRunProcessor {
  private readonly logger = new Logger(OptimizationRunProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shoppingListsService: ShoppingListsService,
    private readonly storeOfferRepository: StoreOfferRepository,
    private readonly multiMarketOptimizerService: MultiMarketOptimizerService,
    private readonly optimizationRunRepository: OptimizationRunRepository,
    private readonly entitlementsService: EntitlementsService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async process(optimizationRunId: string): Promise<void> {
    const optimizationRun =
      await this.optimizationRunRepository.findById(optimizationRunId);

    if (!optimizationRun) {
      this.logger.warn(
        `Optimization run ${optimizationRunId} was queued but could not be found`,
      );
      return;
    }

    const shoppingList = await this.shoppingListsService.getById(
      optimizationRun.userId,
      optimizationRun.shoppingListId,
    );

    const locationContext = await this.resolveLocationContext(optimizationRun);
    const offers = await this.storeOfferRepository.findByListItems(
      shoppingList.items,
      {
        regionId: optimizationRun.regionId,
        establishmentIds: locationContext?.establishmentIds,
      },
    );
    const offersWithDistance = this.applyOfferDistances(
      offers,
      locationContext,
    );
    const computed = this.multiMarketOptimizerService.optimize(
      shoppingList,
      offersWithDistance,
      optimizationRun.mode,
      locationContext
        ? {
            userLocationPreferenceId:
              optimizationRun.userLocationPreferenceId ?? undefined,
            coverageRadiusKm: locationContext.coverageRadiusKm,
            candidateEstablishmentCount:
              locationContext.establishmentIds.length,
          }
        : {
            candidateEstablishmentCount: new Set(
              offersWithDistance.map((offer) => offer.storeId),
            ).size,
          },
    );
    const completedAt = new Date();
    const offersById = new Map(
      offersWithDistance.map((offer) => [offer.id, offer]),
    );
    const itemsById = new Map(
      shoppingList.items.map((item) => [item.id, item]),
    );
    const shoppingListItemDelegate = (
      this.prisma as unknown as {
        shoppingListItem?: {
          update: (input: {
            where: { id: string };
            data: {
              optimizedProductVariantId: string;
              optimizedFromBrandPreferenceMode: 'any' | 'preferred' | 'exact';
              optimizedAt: Date;
            };
          }) => Prisma.PrismaPromise<unknown>;
        };
      }
    ).shoppingListItem;
    const optimizedVariantUpdates = shoppingListItemDelegate
      ? computed.selections
          .map((selection) => {
            const offer = selection.productOfferId
              ? offersById.get(selection.productOfferId)
              : undefined;
            const item = itemsById.get(selection.shoppingListItemId);

            return selection.selectionStatus === 'selected' &&
              offer?.productVariantId &&
              item?.brandPreferenceMode === 'any'
              ? shoppingListItemDelegate.update({
                  where: {
                    id: selection.shoppingListItemId,
                  },
                  data: {
                    optimizedProductVariantId: offer.productVariantId,
                    optimizedFromBrandPreferenceMode: item.brandPreferenceMode,
                    optimizedAt: completedAt,
                  },
                })
              : null;
          })
          .filter((query) => query !== null)
      : [];

    await this.prisma.$transaction([
      this.prisma.optimizationSelection.deleteMany({
        where: {
          optimizationRunId,
        },
      }),
      this.prisma.optimizationSelection.createMany({
        data: computed.selections.map((selection) => ({
          optimizationRunId,
          shoppingListItemId: selection.shoppingListItemId,
          productOfferId: selection.productOfferId ?? null,
          distanceKm:
            selection.distanceKm !== undefined
              ? new Prisma.Decimal(selection.distanceKm.toFixed(2))
              : null,
          status:
            selection.selectionStatus === 'selected'
              ? 'selected'
              : selection.selectionStatus === 'missing'
                ? 'missing'
                : 'review',
          estimatedCost:
            selection.estimatedCost !== undefined
              ? new Prisma.Decimal(selection.estimatedCost)
              : null,
          comparisonPriceAmount:
            selection.comparisonPriceAmount !== undefined
              ? new Prisma.Decimal(selection.comparisonPriceAmount)
              : null,
          regionalAveragePriceAmount:
            selection.regionalAveragePriceAmount !== undefined
              ? new Prisma.Decimal(selection.regionalAveragePriceAmount)
              : null,
          savingsVsComparison:
            selection.savingsVsComparison !== undefined
              ? new Prisma.Decimal(selection.savingsVsComparison)
              : null,
          confidenceNotice: selection.confidenceNotice ?? null,
        })),
      }),
      this.prisma.optimizationRun.update({
        where: {
          id: optimizationRunId,
        },
        data: {
          status: 'completed',
          totalEstimatedCost:
            computed.totalEstimatedCost !== undefined
              ? computed.totalEstimatedCost
              : null,
          estimatedSavings: computed.estimatedSavings ?? 0,
          coverageStatus: computed.coverageStatus,
          summary: computed.explanationSummary ?? null,
          explanationPayload:
            computed.explanationPayload as unknown as Prisma.InputJsonValue,
          candidateEstablishmentCount:
            computed.explanationPayload?.constraints
              .candidateEstablishmentCount ?? null,
          completedAt,
        },
      }),
      this.prisma.shoppingList.update({
        where: {
          id: optimizationRun.shoppingListId,
        },
        data: {
          status: 'ready',
        },
      }),
      ...optimizedVariantUpdates,
    ]);
    await this.entitlementsService.consumeOptimizationToken({
      userId: optimizationRun.userId,
      optimizationRunId: optimizationRun.id,
    });
    await this.notificationsService?.create({
      userId: optimizationRun.userId,
      type: 'optimization_ready',
      title: 'Sua otimizacao esta pronta',
      message: `${shoppingList.name}: resultado concluido com cobertura ${computed.coverageStatus}.`,
      resourceType: 'optimization_run',
      resourceId: optimizationRun.id,
      metadata: {
        shoppingListId: optimizationRun.shoppingListId,
        estimatedSavings: computed.estimatedSavings ?? 0,
      },
    });

    this.logger.log(
      `Optimization run ${optimizationRunId} completed for shopping list ${optimizationRun.shoppingListId} with coverage ${computed.coverageStatus}`,
    );
  }

  private async resolveLocationContext(optimizationRun: {
    mode: string;
    regionId: string;
    userLocationPreferenceId?: string | null;
    coverageRadiusKm?: { toString(): string } | number | null;
  }): Promise<
    | {
        latitude: number;
        longitude: number;
        coverageRadiusKm: number;
        establishmentIds: string[];
        distancesByEstablishmentId: Map<string, number>;
      }
    | undefined
  > {
    if (
      optimizationRun.mode !== 'local_unique' &&
      optimizationRun.mode !== 'local_multi'
    ) {
      return undefined;
    }

    const preference = optimizationRun.userLocationPreferenceId
      ? await this.prisma.userLocationPreference.findUnique({
          where: { id: optimizationRun.userLocationPreferenceId },
        })
      : await this.prisma.userLocationPreference.findFirst({
          where: {
            regionId: optimizationRun.regionId,
            isDefault: true,
          },
        });

    if (
      !preference ||
      preference.latitude === null ||
      preference.longitude === null
    ) {
      return {
        latitude: 0,
        longitude: 0,
        coverageRadiusKm: Number(optimizationRun.coverageRadiusKm ?? 5),
        establishmentIds: [],
        distancesByEstablishmentId: new Map(),
      };
    }

    const latitude = Number(preference.latitude);
    const longitude = Number(preference.longitude);
    const coverageRadiusKm = Number(
      optimizationRun.coverageRadiusKm ?? preference.coverageRadiusKm,
    );
    const establishments = await this.prisma.establishment.findMany({
      where: {
        regionId: optimizationRun.regionId,
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });
    const distancesByEstablishmentId = new Map<string, number>();

    for (const establishment of establishments) {
      const distanceKm = this.distanceInKm(
        latitude,
        longitude,
        Number(establishment.latitude),
        Number(establishment.longitude),
      );

      if (distanceKm <= coverageRadiusKm) {
        distancesByEstablishmentId.set(
          establishment.id,
          Number(distanceKm.toFixed(2)),
        );
      }
    }

    return {
      latitude,
      longitude,
      coverageRadiusKm,
      establishmentIds: [...distancesByEstablishmentId.keys()],
      distancesByEstablishmentId,
    };
  }

  private applyOfferDistances(
    offers: StoreOfferEntity[],
    locationContext?: {
      distancesByEstablishmentId: Map<string, number>;
    },
  ): StoreOfferEntity[] {
    if (!locationContext) {
      return offers;
    }

    return offers.map((offer) => ({
      ...offer,
      distanceKm: locationContext.distancesByEstablishmentId.get(offer.storeId),
    }));
  }

  private distanceInKm(
    originLatitude: number,
    originLongitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
  ) {
    const earthRadiusKm = 6371;
    const latDelta = this.toRadians(destinationLatitude - originLatitude);
    const lonDelta = this.toRadians(destinationLongitude - originLongitude);
    const originLat = this.toRadians(originLatitude);
    const destinationLat = this.toRadians(destinationLatitude);
    const haversine =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(originLat) *
        Math.cos(destinationLat) *
        Math.sin(lonDelta / 2) *
        Math.sin(lonDelta / 2);

    return (
      earthRadiusKm *
      2 *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }
}
