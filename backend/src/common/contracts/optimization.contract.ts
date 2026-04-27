import type { OptimizationMode } from './shopping-list.contract';

export interface OptimizeShoppingListRequest {
  mode: OptimizationMode;
  preferredEstablishmentId?: string;
  regionId?: string;
}

export interface OptimizationSelection {
  id: string;
  shoppingListItemId: string;
  productOfferId?: string;
  shoppingListItemName: string;
  establishmentName?: string;
  establishmentNeighborhood?: string;
  estimatedCost?: number;
  priceAmount?: number;
  sourceLabel?: string;
  observedAt?: string;
  selectionStatus: 'selected' | 'missing' | 'review';
  confidenceNotice?: string;
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
  createdAt: string;
  completedAt?: string;
  selections: OptimizationSelection[];
}
