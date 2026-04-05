import { Injectable } from '@nestjs/common';

import { type OptimizationMode } from '../../common/contracts';
import { type ShoppingListEntity } from '../../lists/domain/shopping-list.entity';
import { type StoreOfferEntity } from '../../stores/domain/store-offer.entity';
import {
  type OptimizationResultEntity,
  type OptimizationSelectionEntity,
} from './optimization-selection.entity';

@Injectable()
export class MultiMarketOptimizerService {
  optimize(
    shoppingList: ShoppingListEntity,
    storeOffers: StoreOfferEntity[],
    mode: OptimizationMode = 'multi_market',
  ): OptimizationResultEntity {
    const selections: OptimizationSelectionEntity[] = shoppingList.items.map((item) => {
      const matchingOffers = storeOffers
        .filter(
          (offer) =>
            offer.canonicalName === item.normalizedName &&
            offer.availabilityStatus === 'available',
        )
        .sort((left, right) => left.price - right.price);

      const cheapestOffer = matchingOffers[0];

      if (!item.normalizedName) {
        return {
          id: `sel_${item.id}`,
          shoppingListItemId: item.id,
          selectionStatus: 'unresolved',
          confidenceNotice: 'Item could not be normalized confidently.',
        };
      }

      if (!cheapestOffer) {
        return {
          id: `sel_${item.id}`,
          shoppingListItemId: item.id,
          selectionStatus: 'unavailable',
          confidenceNotice: 'No confirmed offer is available for this item.',
        };
      }

      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

      return {
        id: `sel_${item.id}`,
        shoppingListItemId: item.id,
        storeOfferId: cheapestOffer.id,
        selectionStatus: 'selected',
        estimatedCost: Number((cheapestOffer.price * quantity).toFixed(2)),
        confidenceNotice:
          cheapestOffer.confidenceScore < 0.75
            ? 'Selected from low-confidence market evidence.'
            : undefined,
      };
    });

    const totalEstimatedCost = Number(
      selections
        .reduce((accumulator, selection) => accumulator + (selection.estimatedCost || 0), 0)
        .toFixed(2),
    );
    const selectedOffers = selections.filter((selection) => selection.selectionStatus === 'selected');
    const coverageStatus =
      selectedOffers.length === shoppingList.items.length ? 'complete' : 'partial';

    return {
      id: `opt_${crypto.randomUUID()}`,
      shoppingListId: shoppingList.id,
      mode,
      totalEstimatedCost,
      coverageStatus,
      generatedAt: new Date().toISOString(),
      explanationSummary:
        coverageStatus === 'complete'
          ? 'Pricely selected the cheapest confirmed offer for each requested item.'
          : 'Pricely selected the cheapest confirmed offers and flagged unresolved or unavailable items.',
      selections,
    };
  }
}
