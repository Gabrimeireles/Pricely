import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ShoppingListsService } from '../lists/application/shopping-lists.service';
import { MultiMarketOptimizerService } from '../optimization/domain/multi-market-optimizer.service';
import { PrismaService } from '../persistence/prisma.service';
import { StoreOfferRepository } from '../stores/infrastructure/store-offer.repository';
import { OptimizationRunRepository } from '../optimization/infrastructure/optimization-run.repository';

@Injectable()
export class OptimizationRunProcessor {
  private readonly logger = new Logger(OptimizationRunProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shoppingListsService: ShoppingListsService,
    private readonly storeOfferRepository: StoreOfferRepository,
    private readonly multiMarketOptimizerService: MultiMarketOptimizerService,
    private readonly optimizationRunRepository: OptimizationRunRepository,
  ) {}

  async process(optimizationRunId: string): Promise<void> {
    const optimizationRun = await this.optimizationRunRepository.findById(
      optimizationRunId,
    );

    if (!optimizationRun) {
      this.logger.warn(`Optimization run ${optimizationRunId} was queued but could not be found`);
      return;
    }

    const shoppingList = await this.shoppingListsService.getById(
      optimizationRun.userId,
      optimizationRun.shoppingListId,
    );

    const offers = await this.storeOfferRepository.findByListItems(shoppingList.items);
    const computed = this.multiMarketOptimizerService.optimize(
      shoppingList,
      offers,
      optimizationRun.mode,
    );
    const completedAt = new Date();
    const offersById = new Map(offers.map((offer) => [offer.id, offer]));
    const itemsById = new Map(shoppingList.items.map((item) => [item.id, item]));
    const shoppingListItemDelegate = (
      this.prisma as unknown as {
        shoppingListItem?: {
          update: (input: {
            where: { id: string };
            data: {
              lockedProductVariantId: string;
              optimizedProductVariantId: string;
              optimizedFromBrandPreferenceMode: 'any' | 'preferred' | 'exact';
              optimizedAt: Date;
            };
          }) => Prisma.PrismaPromise<unknown>;
        };
      }
    ).shoppingListItem;
    const optimizedVariantUpdates = shoppingListItemDelegate
      ? computed.selections.map((selection) => {
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
                lockedProductVariantId: offer.productVariantId,
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

    this.logger.log(
      `Optimization run ${optimizationRunId} completed for shopping list ${optimizationRun.shoppingListId} with coverage ${computed.coverageStatus}`,
    );
  }
}
