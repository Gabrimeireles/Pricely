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
    mode: OptimizationMode = 'global_full',
  ): OptimizationResultEntity {
    const itemOffers = new Map(
      shoppingList.items.map((item) => [item.id, this.findMatchingOffers(item, storeOffers)]),
    );
    const selectedStoreId =
      mode === 'global_full' ? undefined : this.selectSingleStore(shoppingList, itemOffers, mode);
    const selections: OptimizationSelectionEntity[] = shoppingList.items.map((item) =>
      this.selectOfferForItem(item, itemOffers.get(item.id) ?? [], selectedStoreId),
    );

    const totalEstimatedCost = Number(
      selections
        .reduce((accumulator, selection) => accumulator + (selection.estimatedCost || 0), 0)
        .toFixed(2),
    );
    const selectedOffers = selections.filter((selection) => selection.selectionStatus === 'selected');
    const coverageStatus =
      selectedOffers.length === 0
        ? 'none'
        : selectedOffers.length === shoppingList.items.length
          ? 'complete'
          : 'partial';

    return {
      id: `opt_${crypto.randomUUID()}`,
      shoppingListId: shoppingList.id,
      mode,
      status: 'completed',
      totalEstimatedCost: selectedOffers.length > 0 ? totalEstimatedCost : undefined,
      coverageStatus,
      createdAt: new Date().toISOString(),
      explanationSummary:
        this.buildSummary(mode, coverageStatus, selectedStoreId, selections),
      selections,
    };
  }

  private findMatchingOffers(
    item: ShoppingListEntity['items'][number],
    storeOffers: StoreOfferEntity[],
  ): StoreOfferEntity[] {
    const availableOffers = storeOffers.filter(
      (offer) =>
        this.matchesBaseProduct(item, offer) &&
        offer.availabilityStatus === 'available',
    );

    return this.applyBrandPreference(item, availableOffers).sort(
      (left, right) => left.price - right.price,
    );
  }

  private selectOfferForItem(
    item: ShoppingListEntity['items'][number],
    matchingOffers: StoreOfferEntity[],
    selectedStoreId?: string,
  ): OptimizationSelectionEntity {
    if (!item.normalizedName) {
      return {
        id: `sel_${item.id}`,
        shoppingListItemId: item.id,
        shoppingListItemName: item.requestedName,
        selectionStatus: 'review',
        confidenceNotice: 'Item could not be normalized confidently.',
      };
    }

    const scopedOffers = selectedStoreId
      ? matchingOffers.filter((offer) => offer.storeId === selectedStoreId)
      : matchingOffers;
    const cheapestOffer = scopedOffers[0];

    if (!cheapestOffer) {
      return {
        id: `sel_${item.id}`,
        shoppingListItemId: item.id,
        shoppingListItemName: item.requestedName,
        selectionStatus: 'missing',
        confidenceNotice: selectedStoreId
          ? 'The selected store does not have a confirmed offer for this item.'
          : 'No confirmed offer is available for this item.',
      };
    }

    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

    return {
      id: `sel_${item.id}`,
      shoppingListItemId: item.id,
      productOfferId: cheapestOffer.id,
      shoppingListItemName: item.requestedName,
      establishmentName: cheapestOffer.storeName,
      selectionStatus: 'selected',
      estimatedCost: Number((cheapestOffer.price * quantity).toFixed(2)),
      priceAmount: Number(cheapestOffer.price.toFixed(2)),
      sourceLabel: cheapestOffer.sourceReceiptLineItemId,
      observedAt: cheapestOffer.observedAt,
      confidenceNotice:
        cheapestOffer.confidenceScore < 0.75
          ? 'Selected from low-confidence market evidence.'
          : undefined,
    };
  }

  private selectSingleStore(
    shoppingList: ShoppingListEntity,
    itemOffers: Map<string, StoreOfferEntity[]>,
    mode: Exclude<OptimizationMode, 'global_full'>,
  ): string | undefined {
    const storeScores = new Map<
      string,
      { storeName: string; matchedItems: number; totalCost: number }
    >();

    for (const item of shoppingList.items) {
      const offers = itemOffers.get(item.id) ?? [];
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

      for (const offer of offers) {
        const score = storeScores.get(offer.storeId) ?? {
          storeName: offer.storeName,
          matchedItems: 0,
          totalCost: 0,
        };

        const alreadyCounted = offers
          .slice(0, offers.findIndex((entry) => entry.id === offer.id))
          .some((entry) => entry.storeId === offer.storeId);

        if (!alreadyCounted) {
          score.matchedItems += 1;
          score.totalCost += offer.price * quantity;
        }

        storeScores.set(offer.storeId, score);
      }
    }

    const maxCoverage = Math.max(
      0,
      ...[...storeScores.values()].map((score) => score.matchedItems),
    );
    const rankedStores = [...storeScores.entries()].sort((left, right) => {
      const [, leftScore] = left;
      const [, rightScore] = right;

      if (mode === 'global_unique') {
        const leftFullCoverage = leftScore.matchedItems === shoppingList.items.length;
        const rightFullCoverage = rightScore.matchedItems === shoppingList.items.length;

        if (leftFullCoverage !== rightFullCoverage) {
          return rightFullCoverage ? 1 : -1;
        }
      }

      if (mode === 'local') {
        if (rightScore.matchedItems !== leftScore.matchedItems) {
          return rightScore.matchedItems - leftScore.matchedItems;
        }

        return leftScore.totalCost - rightScore.totalCost;
      }

      if (leftScore.matchedItems === maxCoverage && rightScore.matchedItems !== maxCoverage) {
        return -1;
      }

      if (rightScore.matchedItems === maxCoverage && leftScore.matchedItems !== maxCoverage) {
        return 1;
      }

      if (leftScore.totalCost !== rightScore.totalCost) {
        return leftScore.totalCost - rightScore.totalCost;
      }

      return rightScore.matchedItems - leftScore.matchedItems;
    });

    return rankedStores[0]?.[0];
  }

  private buildSummary(
    mode: OptimizationMode,
    coverageStatus: OptimizationResultEntity['coverageStatus'],
    selectedStoreId: string | undefined,
    selections: OptimizationSelectionEntity[],
  ): string {
    const selectedStoreName = selectedStoreId
      ? selections.find((selection) => selection.selectionStatus === 'selected')?.establishmentName
      : undefined;

    if (mode === 'global_full') {
      return coverageStatus === 'complete'
        ? 'Pricely selected the cheapest confirmed offer for each requested item.'
        : coverageStatus === 'partial'
          ? 'Pricely selected the cheapest confirmed offers and flagged unresolved or unavailable items.'
          : 'Pricely could not find confirmed offers for the requested items yet.';
    }

    if (mode === 'global_unique') {
      return selectedStoreName
        ? `Pricely concentrated the list in ${selectedStoreName} to minimize total cost in a single store.`
        : 'Pricely could not find a single store with confirmed offers for the requested items.';
    }

    return selectedStoreName
      ? `Pricely prioritized one nearby-style store flow in ${selectedStoreName}, maximizing coverage before price.`
      : 'Pricely could not find a practical single-store option for this list.';
  }

  private matchesBaseProduct(
    item: ShoppingListEntity['items'][number],
    offer: StoreOfferEntity,
  ): boolean {
    return Boolean(
      (item.catalogProductId && offer.catalogProductId === item.catalogProductId) ||
        (!item.catalogProductId &&
          item.normalizedName &&
          offer.canonicalName === item.normalizedName),
    );
  }

  private applyBrandPreference(
    item: ShoppingListEntity['items'][number],
    offers: StoreOfferEntity[],
  ): StoreOfferEntity[] {
    if (item.brandPreferenceMode === 'exact') {
      return offers.filter(
        (offer) =>
          Boolean(
            item.lockedProductVariantId &&
              offer.productVariantId === item.lockedProductVariantId,
          ),
      );
    }

    if (item.brandPreferenceMode === 'preferred') {
      if (item.preferredBrandNames.length === 0) {
        return offers;
      }

      const preferredBrands = new Set(
        item.preferredBrandNames.map((brand) => brand.trim().toLowerCase()).filter(Boolean),
      );
      const preferredOffers = offers.filter((offer) =>
        Boolean(offer.brandName && preferredBrands.has(offer.brandName.toLowerCase())),
      );

      return preferredOffers.length > 0 ? preferredOffers : offers;
    }

    return offers;
  }
}
