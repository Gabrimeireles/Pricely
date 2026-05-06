import { type OptimizationMode } from '../../common/contracts';

export type CoverageStatus = 'complete' | 'partial' | 'none';
export type SelectionStatus = 'selected' | 'missing' | 'review';

export interface OptimizationSelectionEntity {
  id: string;
  shoppingListItemId: string;
  productOfferId?: string;
  shoppingListItemName: string;
  establishmentName?: string;
  establishmentNeighborhood?: string;
  estimatedCost?: number;
  priceAmount?: number;
  comparisonPriceAmount?: number;
  regionalAveragePriceAmount?: number;
  savingsVsComparison?: number;
  sourceLabel?: string;
  observedAt?: string;
  selectionStatus: SelectionStatus;
  confidenceNotice?: string;
}

export interface OptimizationResultEntity {
  id: string;
  shoppingListId: string;
  mode: OptimizationMode;
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalEstimatedCost?: number;
  estimatedSavings?: number;
  coverageStatus: CoverageStatus;
  createdAt: string;
  completedAt?: string;
  explanationSummary?: string;
  selections: OptimizationSelectionEntity[];
}
