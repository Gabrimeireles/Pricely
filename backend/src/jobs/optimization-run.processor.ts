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
    ]);

    this.logger.log(
      `Optimization run ${optimizationRunId} completed for shopping list ${optimizationRun.shoppingListId} with coverage ${computed.coverageStatus}`,
    );
  }
}
