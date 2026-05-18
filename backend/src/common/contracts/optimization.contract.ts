import type {
  OptimizationMode,
  OptimizationModeRequest,
} from './shopping-list.contract';

export interface OptimizeShoppingListRequest {
  mode: OptimizationModeRequest;
  preferredEstablishmentId?: string;
  regionId?: string;
  locationPreferenceId?: string;
  userLocationPreferenceId?: string;
  coverageRadiusKm?: number;
}

export interface OptimizationSelection {
  id: string;
  shoppingListItemId: string;
  productOfferId?: string;
  shoppingListItemName: string;
  selectedOfferName?: string;
  selectedVariantName?: string;
  selectedPackageLabel?: string;
  selectedVariantImageUrl?: string;
  establishmentName?: string;
  establishmentNeighborhood?: string;
  distanceKm?: number;
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
  selectionStatus: 'selected' | 'missing' | 'review';
  confidenceNotice?: string;
  decisionReason?: string;
  rejectedReason?: string;
}

export interface OptimizationExplanationPayload {
  version: 1;
  constraints: {
    mode: OptimizationMode;
    singleStoreRequired: boolean;
    selectedStoreId?: string;
    userLocationPreferenceId?: string;
    coverageRadiusKm?: number;
    candidateEstablishmentCount?: number;
    exactVariantItemIds: string[];
    unresolvedItemPolicy: 'flag_missing_or_review';
  };
  selectedOffers: Array<{
    shoppingListItemId: string;
    productOfferId: string;
    storeId?: string;
    storeName?: string;
    distanceKm?: number;
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
    distanceKm?: number;
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

export interface OptimizationRunAccepted {
  id: string;
  jobId: string;
  shoppingListId: string;
  mode: OptimizationMode;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queuedAt: string;
}

export interface OptimizationResult {
  id: string;
  shoppingListId: string;
  mode: OptimizationMode;
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalEstimatedCost?: number;
  estimatedSavings?: number;
  coverageStatus: 'complete' | 'partial' | 'none';
  explanationSummary?: string;
  explanationPayload?: OptimizationExplanationPayload;
  createdAt: string;
  completedAt?: string;
  selections: OptimizationSelection[];
}
