import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Queue } from 'bullmq';
import { Inject } from '@nestjs/common';

import {
  type OptimizeShoppingListRequest,
  type OptimizationResult,
} from '../../common/contracts';
import {
  OPTIMIZATION_QUEUE,
  type OptimizationJob,
} from '../../common/queue/queue.tokens';
import { ShoppingListsService } from '../../lists/application/shopping-lists.service';
import { ShoppingListRepository } from '../../lists/infrastructure/shopping-list.repository';
import { MultiMarketOptimizerService } from '../domain/multi-market-optimizer.service';
import { OptimizationResultRepository } from '../infrastructure/optimization-result.repository';
import { StoreOfferRepository } from '../../stores/infrastructure/store-offer.repository';

@Injectable()
export class OptimizationResultService {
  private readonly logger = new Logger(OptimizationResultService.name);

  constructor(
    private readonly shoppingListsService: ShoppingListsService,
    private readonly shoppingListRepository: ShoppingListRepository,
    private readonly storeOfferRepository: StoreOfferRepository,
    private readonly multiMarketOptimizerService: MultiMarketOptimizerService,
    private readonly optimizationResultRepository: OptimizationResultRepository,
    @Inject(OPTIMIZATION_QUEUE)
    private readonly optimizationQueue: Queue<OptimizationJob>,
  ) {}

  async optimize(
    shoppingListId: string,
    request: OptimizeShoppingListRequest,
  ): Promise<OptimizationResult> {
    const shoppingList = await this.shoppingListsService.getById(shoppingListId);
    const canonicalNames = shoppingList.items
      .map((item) => item.normalizedName)
      .filter((value): value is string => Boolean(value));
    const offers = await this.storeOfferRepository.findByCanonicalNames(canonicalNames);
    const result = this.multiMarketOptimizerService.optimize(
      shoppingList,
      offers,
      request.mode,
    );

    await this.optimizationResultRepository.save(result);
    await this.shoppingListRepository.updateStatus(shoppingListId, 'optimized');
    await this.optimizationQueue.add('optimization-generated', {
      shoppingListId,
      optimizationResultId: result.id,
    });

    this.logger.log(
      `Optimization ${result.id} generated for shopping list ${shoppingListId} with coverage ${result.coverageStatus}`,
    );

    return result;
  }

  async getLatest(shoppingListId: string): Promise<OptimizationResult> {
    const latest = await this.optimizationResultRepository.findLatestByShoppingListId(
      shoppingListId,
    );

    if (!latest) {
      throw new NotFoundException(
        `No optimization result found for shopping list ${shoppingListId}`,
      );
    }

    return latest;
  }
}
