import { type OptimizationMode } from '../../common/contracts';

export type ShoppingListStatus = 'draft' | 'ready' | 'optimized' | 'stale';
export type ShoppingListResolutionStatus =
  | 'unresolved'
  | 'matched'
  | 'partially_matched'
  | 'unavailable';

export interface ShoppingListItemEntity {
  id: string;
  requestedName: string;
  normalizedName?: string;
  quantity?: number;
  unit?: string;
  preferredBrand?: string;
  notes?: string;
  resolutionStatus: ShoppingListResolutionStatus;
}

export interface ShoppingListEntity {
  id: string;
  name: string;
  mode: OptimizationMode;
  preferredStoreId?: string;
  locationHint?: string;
  status: ShoppingListStatus;
  items: ShoppingListItemEntity[];
  createdAt: string;
  updatedAt: string;
}
