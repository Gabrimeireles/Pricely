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
  trustFactor?: number;
  trustLevel?: 'high' | 'medium' | 'low';
  trustEvidenceCount?: number;
  trustFreshnessDays?: number;
  trustLastValidatedAt?: string;
  trustExplanation?: string;
  selectionStatus: SelectionStatus;
  confidenceNotice?: string;
  decisionReason?: string;
  rejectedReason?: string;
}

export interface OptimizationExplanationPayload {
  version: 1;
  constraints: {
    mode: string;
    singleStoreRequired: boolean;
    selectedStoreId?: string;
    exactVariantItemIds: string[];
    unresolvedItemPolicy: 'flag_missing_or_review';
  };
  selectedOffers: Array<{
    shoppingListItemId: string;
    productOfferId: string;
    storeId?: string;
    storeName?: string;
    priceAmount?: number;
    estimatedCost?: number;
    savingsVsComparison?: number;
    decisionReason?: string;
    trustFactor?: number;
    trustLevel?: 'high' | 'medium' | 'low';
    trustEvidenceCount?: number;
    trustFreshnessDays?: number;
    trustLastValidatedAt?: string;
    trustExplanation?: string;
  }>;
  rejectedAlternatives: Array<{
    shoppingListItemId: string;
    productOfferId?: string;
    storeId?: string;
    storeName?: string;
    priceAmount?: number;
    reason: string;
  }>;
  savingsComparisons: Array<{
    shoppingListItemId: string;
    selectedPriceAmount?: number;
    comparisonPriceAmount?: number;
    regionalAveragePriceAmount?: number;
    savingsVsComparison?: number;
  }>;
  dataQualityWarnings: Array<{
    shoppingListItemId: string;
    code: string;
    message: string;
  }>;
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
  explanationPayload?: OptimizationExplanationPayload;
  selections: OptimizationSelectionEntity[];
}
