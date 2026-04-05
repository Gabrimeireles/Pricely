import type { OptimizationMode } from './shopping-list.contract';

export interface OptimizeShoppingListRequest {
  mode: OptimizationMode;
  preferredStoreId?: string;
  locationHint?: string;
}

export interface OptimizationSelection {
  shoppingListItemId: string;
  storeOfferId?: string;
  selectionStatus: 'selected' | 'unavailable' | 'unresolved';
  estimatedCost?: number;
  confidenceNotice?: string;
}

export interface OptimizationResult {
  id: string;
  shoppingListId: string;
  mode: OptimizationMode;
  recommendedStoreId?: string;
  totalEstimatedCost: number;
  savingsComparedToAlternative?: number;
  coverageStatus: 'complete' | 'partial';
  explanationSummary?: string;
  generatedAt: string;
  selections: OptimizationSelection[];
}
