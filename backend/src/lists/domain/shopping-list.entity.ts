import { type OptimizationMode } from '../../common/contracts';

export type ShoppingListStatus = 'draft' | 'ready' | 'archived';
export type ShoppingListResolutionStatus =
  | 'unresolved'
  | 'matched'
  | 'partial'
  | 'missing';

export interface ShoppingListItemEntity {
  id: string;
  catalogProductId?: string;
  lockedProductVariantId?: string;
  brandPreferenceMode: 'any' | 'exact';
  preferredBrandNames: string[];
  imageUrl?: string;
  requestedName: string;
  normalizedName?: string;
  quantity?: number;
  unitLabel?: string;
  notes?: string;
  purchaseStatus: 'pending' | 'purchased';
  purchasedAt?: string;
  resolutionStatus: ShoppingListResolutionStatus;
}

export interface ShoppingListEntity {
  id: string;
  userId: string;
  name: string;
  preferredRegionId?: string;
  status: ShoppingListStatus;
  lastMode: OptimizationMode;
  latestEstimatedSavings: number;
  latestOptimizationStatus?: 'queued' | 'running' | 'completed' | 'failed';
  latestOptimizedAt?: string;
  items: ShoppingListItemEntity[];
  createdAt: string;
  updatedAt: string;
}
