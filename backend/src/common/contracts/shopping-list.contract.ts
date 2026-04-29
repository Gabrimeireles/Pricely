export type OptimizationMode = 'local' | 'global_unique' | 'global_full';

export interface ShoppingListItemInput {
  requestedName: string;
  catalogProductId?: string;
  lockedProductVariantId?: string;
  brandPreferenceMode?: 'any' | 'preferred' | 'exact';
  preferredBrandNames?: string[];
  purchaseStatus?: 'pending' | 'purchased';
  quantity?: number;
  unitLabel?: string;
  notes?: string;
}

export interface CreateShoppingListRequest {
  name: string;
  preferredRegionId?: string;
  lastMode?: OptimizationMode;
}

export interface ShoppingListItem {
  id: string;
  catalogProductId?: string;
  lockedProductVariantId?: string;
  brandPreferenceMode: 'any' | 'preferred' | 'exact';
  preferredBrandNames: string[];
  imageUrl?: string;
  requestedName: string;
  normalizedName?: string;
  quantity?: number;
  unitLabel?: string;
  notes?: string;
  purchaseStatus: 'pending' | 'purchased';
  purchasedAt?: string;
  resolutionStatus: 'unresolved' | 'matched' | 'partial' | 'missing';
}

export interface ShoppingList {
  id: string;
  name: string;
  preferredRegionId?: string;
  status: 'draft' | 'ready' | 'archived';
  lastMode: OptimizationMode;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}
