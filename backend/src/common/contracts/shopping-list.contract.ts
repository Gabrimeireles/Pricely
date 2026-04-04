export type OptimizationMode =
  | 'multi_market'
  | 'local_market'
  | 'global_store';

export interface ShoppingListItemInput {
  requestedName: string;
  quantity?: number;
  unit?: string;
  preferredBrand?: string;
  notes?: string;
}

export interface CreateShoppingListRequest {
  name: string;
  mode: OptimizationMode;
  preferredStoreId?: string;
  locationHint?: string;
}

export interface ShoppingListItem extends ShoppingListItemInput {
  id: string;
  normalizedName?: string;
  resolutionStatus:
    | 'unresolved'
    | 'matched'
    | 'partially_matched'
    | 'unavailable';
}

export interface ShoppingList {
  id: string;
  name: string;
  mode: OptimizationMode;
  preferredStoreId?: string;
  locationHint?: string;
  status: 'draft' | 'ready' | 'optimized' | 'stale';
  items: ShoppingListItem[];
}
