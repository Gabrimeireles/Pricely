import { type OptimizationMode } from '../../common/contracts';

export type CoverageStatus = 'complete' | 'partial';
export type SelectionStatus = 'selected' | 'unavailable' | 'unresolved';

export interface OptimizationSelectionEntity {
  id: string;
  shoppingListItemId: string;
  storeOfferId?: string;
  selectionStatus: SelectionStatus;
  estimatedCost?: number;
  confidenceNotice?: string;
}

export interface OptimizationResultEntity {
  id: string;
  shoppingListId: string;
  mode: OptimizationMode;
  recommendedStoreId?: string;
  totalEstimatedCost: number;
  savingsComparedToAlternative?: number;
  coverageStatus: CoverageStatus;
  generatedAt: string;
  explanationSummary?: string;
  selections: OptimizationSelectionEntity[];
}
