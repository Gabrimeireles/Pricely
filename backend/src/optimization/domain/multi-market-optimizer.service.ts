import { Injectable } from '@nestjs/common';

import { type OptimizationMode } from '../../common/contracts';
import { type ShoppingListEntity } from '../../lists/domain/shopping-list.entity';
import { type StoreOfferEntity } from '../../stores/domain/store-offer.entity';
import {
  type OptimizationExplanationPayload,
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
    const itemOffers = this.generateCandidates(shoppingList, storeOffers);
    const selectedStoreId = this.solveStoreConstraint(
      shoppingList,
      itemOffers,
      mode,
    );
    const selections: OptimizationSelectionEntity[] = shoppingList.items.map(
      (item) =>
        this.selectOfferForItem(
          item,
          itemOffers.get(item.id) ?? [],
          selectedStoreId,
        ),
    );

    const score = this.scoreSelections(selections);
    const selectedOffers = selections.filter(
      (selection) => selection.selectionStatus === 'selected',
    );
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
      totalEstimatedCost:
        selectedOffers.length > 0 ? score.totalEstimatedCost : undefined,
      estimatedSavings: score.estimatedSavings > 0 ? score.estimatedSavings : 0,
      coverageStatus,
      createdAt: new Date().toISOString(),
      explanationSummary: this.buildSummary(
        mode,
        coverageStatus,
        selectedStoreId,
        selections,
      ),
      explanationPayload: this.buildExplanationPayload(
        shoppingList,
        storeOffers,
        selections,
        mode,
        selectedStoreId,
      ),
      selections,
    };
  }

  private generateCandidates(
    shoppingList: ShoppingListEntity,
    storeOffers: StoreOfferEntity[],
  ): Map<string, StoreOfferEntity[]> {
    return new Map(
      shoppingList.items.map((item) => [
        item.id,
        this.findMatchingOffers(item, storeOffers),
      ]),
    );
  }

  private solveStoreConstraint(
    shoppingList: ShoppingListEntity,
    itemOffers: Map<string, StoreOfferEntity[]>,
    mode: OptimizationMode,
  ): string | undefined {
    return mode === 'global_full'
      ? undefined
      : this.selectSingleStore(shoppingList, itemOffers, mode);
  }

  private scoreSelections(selections: OptimizationSelectionEntity[]): {
    totalEstimatedCost: number;
    estimatedSavings: number;
  } {
    return {
      totalEstimatedCost: Number(
        selections
          .reduce(
            (accumulator, selection) =>
              accumulator + (selection.estimatedCost || 0),
            0,
          )
          .toFixed(2),
      ),
      estimatedSavings: Number(
        selections
          .reduce(
            (accumulator, selection) =>
              accumulator + (selection.savingsVsComparison || 0),
            0,
          )
          .toFixed(2),
      ),
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
        decisionReason: 'manual_review_required',
        rejectedReason: 'missing_normalized_product',
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
        decisionReason: 'no_confirmed_offer',
        rejectedReason: selectedStoreId
          ? 'single_store_constraint'
          : 'no_active_available_offer',
      };
    }

    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const comparison = this.calculateVariantComparison(
      cheapestOffer,
      matchingOffers,
    );

    return {
      id: `sel_${item.id}`,
      shoppingListItemId: item.id,
      productOfferId: cheapestOffer.id,
      shoppingListItemName: item.requestedName,
      establishmentName: cheapestOffer.storeName,
      selectionStatus: 'selected',
      estimatedCost: Number((cheapestOffer.price * quantity).toFixed(2)),
      priceAmount: Number(cheapestOffer.price.toFixed(2)),
      comparisonPriceAmount: comparison.highestPriceAmount,
      regionalAveragePriceAmount: comparison.averagePriceAmount,
      savingsVsComparison: Number(
        Math.max(
          0,
          (comparison.highestPriceAmount - cheapestOffer.price) * quantity,
        ).toFixed(2),
      ),
      sourceLabel: cheapestOffer.sourceReceiptLineItemId,
      observedAt: cheapestOffer.observedAt,
      confidenceNotice:
        cheapestOffer.confidenceScore < 0.75
          ? 'Selected from low-confidence market evidence.'
          : undefined,
      decisionReason: selectedStoreId
        ? `Selected best confirmed offer inside ${cheapestOffer.storeName}.`
        : 'Selected cheapest confirmed regional offer for this product constraint.',
    };
  }

  private calculateVariantComparison(
    selectedOffer: StoreOfferEntity,
    matchingOffers: StoreOfferEntity[],
  ) {
    const comparableOffers = matchingOffers.filter((offer) =>
      selectedOffer.productVariantId
        ? offer.productVariantId === selectedOffer.productVariantId
        : offer.canonicalName === selectedOffer.canonicalName,
    );
    const prices = comparableOffers.map((offer) => offer.price);
    const highestPriceAmount =
      prices.length > 0 ? Math.max(...prices) : selectedOffer.price;
    const averagePriceAmount =
      prices.length > 0
        ? Number(
            (
              prices.reduce((sum, price) => sum + price, 0) / prices.length
            ).toFixed(2),
          )
        : selectedOffer.price;

    return {
      highestPriceAmount: Number(highestPriceAmount.toFixed(2)),
      averagePriceAmount,
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
          .slice(
            0,
            offers.findIndex((entry) => entry.id === offer.id),
          )
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
        const leftFullCoverage =
          leftScore.matchedItems === shoppingList.items.length;
        const rightFullCoverage =
          rightScore.matchedItems === shoppingList.items.length;

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

      if (
        leftScore.matchedItems === maxCoverage &&
        rightScore.matchedItems !== maxCoverage
      ) {
        return -1;
      }

      if (
        rightScore.matchedItems === maxCoverage &&
        leftScore.matchedItems !== maxCoverage
      ) {
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
      ? selections.find((selection) => selection.selectionStatus === 'selected')
          ?.establishmentName
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

  private buildExplanationPayload(
    shoppingList: ShoppingListEntity,
    storeOffers: StoreOfferEntity[],
    selections: OptimizationSelectionEntity[],
    mode: OptimizationMode,
    selectedStoreId?: string,
  ): OptimizationExplanationPayload {
    const selectionsByItemId = new Map(
      selections.map((selection) => [selection.shoppingListItemId, selection]),
    );
    const offersById = new Map(storeOffers.map((offer) => [offer.id, offer]));

    return {
      version: 1,
      constraints: {
        mode,
        singleStoreRequired: mode !== 'global_full',
        selectedStoreId,
        exactVariantItemIds: shoppingList.items
          .filter((item) => item.brandPreferenceMode === 'exact')
          .map((item) => item.id),
        unresolvedItemPolicy: 'flag_missing_or_review',
      },
      selectedOffers: selections
        .filter(
          (selection) =>
            selection.selectionStatus === 'selected' &&
            Boolean(selection.productOfferId),
        )
        .map((selection) => {
          const offer = offersById.get(selection.productOfferId as string);

          return {
            shoppingListItemId: selection.shoppingListItemId,
            productOfferId: selection.productOfferId as string,
            storeId: offer?.storeId,
            storeName: selection.establishmentName,
            priceAmount: selection.priceAmount,
            estimatedCost: selection.estimatedCost,
            savingsVsComparison: selection.savingsVsComparison,
            decisionReason: selection.decisionReason,
          };
        }),
      rejectedAlternatives: shoppingList.items.flatMap((item) =>
        this.buildRejectedAlternativesForItem(
          item,
          storeOffers,
          selectionsByItemId.get(item.id),
          selectedStoreId,
        ),
      ),
      savingsComparisons: selections.map((selection) => ({
        shoppingListItemId: selection.shoppingListItemId,
        selectedPriceAmount: selection.priceAmount,
        comparisonPriceAmount: selection.comparisonPriceAmount,
        regionalAveragePriceAmount: selection.regionalAveragePriceAmount,
        savingsVsComparison: selection.savingsVsComparison,
      })),
      dataQualityWarnings: selections.flatMap((selection) =>
        this.buildDataQualityWarningsForSelection(selection),
      ),
    };
  }

  private buildRejectedAlternativesForItem(
    item: ShoppingListEntity['items'][number],
    storeOffers: StoreOfferEntity[],
    selection?: OptimizationSelectionEntity,
    selectedStoreId?: string,
  ): OptimizationExplanationPayload['rejectedAlternatives'] {
    const matchingOffers = this.applyBrandPreference(
      item,
      storeOffers.filter((offer) => this.matchesBaseProduct(item, offer)),
    );

    if (matchingOffers.length === 0) {
      return [
        {
          shoppingListItemId: item.id,
          reason: selection?.rejectedReason ?? 'no_matching_offer_candidate',
        },
      ];
    }

    return matchingOffers
      .filter((offer) => offer.id !== selection?.productOfferId)
      .sort((left, right) => left.price - right.price)
      .slice(0, 10)
      .map((offer) => ({
        shoppingListItemId: item.id,
        productOfferId: offer.id,
        storeId: offer.storeId,
        storeName: offer.storeName,
        priceAmount: Number(offer.price.toFixed(2)),
        reason: this.resolveRejectedAlternativeReason(
          offer,
          selection,
          selectedStoreId,
        ),
      }));
  }

  private resolveRejectedAlternativeReason(
    offer: StoreOfferEntity,
    selection?: OptimizationSelectionEntity,
    selectedStoreId?: string,
  ): string {
    if (offer.availabilityStatus !== 'available') {
      return 'not_available';
    }

    if (selectedStoreId && offer.storeId !== selectedStoreId) {
      return 'single_store_constraint';
    }

    if (!selection || selection.selectionStatus !== 'selected') {
      return selection?.rejectedReason ?? 'not_selected';
    }

    return 'higher_price_or_lower_rank';
  }

  private buildDataQualityWarningsForSelection(
    selection: OptimizationSelectionEntity,
  ): OptimizationExplanationPayload['dataQualityWarnings'] {
    const warnings: OptimizationExplanationPayload['dataQualityWarnings'] = [];

    if (selection.confidenceNotice) {
      warnings.push({
        shoppingListItemId: selection.shoppingListItemId,
        code: 'confidence_notice',
        message: selection.confidenceNotice,
      });
    }

    if (selection.selectionStatus === 'missing') {
      warnings.push({
        shoppingListItemId: selection.shoppingListItemId,
        code: selection.rejectedReason ?? 'missing_offer',
        message: 'No confirmed offer was selected for this item.',
      });
    }

    if (selection.selectionStatus === 'review') {
      warnings.push({
        shoppingListItemId: selection.shoppingListItemId,
        code: selection.rejectedReason ?? 'manual_review_required',
        message: 'This item needs review before the result can be trusted.',
      });
    }

    return warnings;
  }

  private matchesBaseProduct(
    item: ShoppingListEntity['items'][number],
    offer: StoreOfferEntity,
  ): boolean {
    return Boolean(
      (item.catalogProductId &&
        offer.catalogProductId === item.catalogProductId) ||
      (!item.catalogProductId &&
        item.normalizedName &&
        (offer.matchingCanonicalNames ?? [offer.canonicalName]).includes(
          item.normalizedName,
        )),
    );
  }

  private applyBrandPreference(
    item: ShoppingListEntity['items'][number],
    offers: StoreOfferEntity[],
  ): StoreOfferEntity[] {
    if (item.brandPreferenceMode === 'exact') {
      return offers.filter((offer) =>
        Boolean(
          item.lockedProductVariantId &&
          offer.productVariantId === item.lockedProductVariantId,
        ),
      );
    }

    return offers;
  }
}
