export type OptimizationModeId =
  | 'local'
  | 'global_unique'
  | 'global_full';

export type FreshnessLevel = 'fresh' | 'aging' | 'stale';
export type ConfidenceLevel = 'alta' | 'media' | 'baixa';

export interface SupportedCity {
  id: string;
  name: string;
  stateCode: string;
  activeStoreCount: number;
  coverageStatus: 'live' | 'collecting_data';
  regionLabel: string;
  status: 'supported' | 'pilot' | 'soon';
  stores: string[];
  neighborhoods: string[];
}

export interface OfferEvidence {
  sourceLabel: string;
  capturedAt: string;
  sourceType: 'nota' | 'panfleto' | 'site';
}

export interface RegionalOffer {
  id: string;
  cityId: string;
  storeName: string;
  neighborhood: string;
  productName: string;
  normalizedName: string;
  brand?: string;
  packageLabel: string;
  price: number;
  previousPrice?: number;
  freshness: FreshnessLevel;
  confidence: ConfidenceLevel;
  updatedAt: string;
  highlight: string;
  evidence: OfferEvidence[];
  imageUrl: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  catalogProductId?: string;
  lockedProductVariantId?: string;
  brandPreferenceMode?: 'any' | 'preferred' | 'exact';
  preferredBrandNames?: string[];
  imageUrl?: string;
  quantity: number;
  unitLabel: string;
  note?: string;
  purchaseStatus?: 'pending' | 'purchased';
  status: 'resolved' | 'partial' | 'missing';
}

export interface ShoppingList {
  id: string;
  name: string;
  cityId: string;
  lastMode: OptimizationModeId;
  updatedAt: string;
  expectedSavings: number;
  items: ShoppingListItem[];
}

export interface OptimizationDecision {
  id: string;
  itemName: string;
  quantityLabel: string;
  storeName?: string;
  neighborhood?: string;
  price?: number;
  sourceLabel?: string;
  updatedAt?: string;
  confidence: ConfidenceLevel;
  status: 'selected' | 'missing' | 'review';
  note: string;
}

export interface OptimizationScenario {
  mode: OptimizationModeId;
  label: string;
  summary: string;
  totalEstimatedCost: number;
  estimatedSavings: number;
  coverageLabel: string;
  tradeoffLabel: string;
  recommendedStore?: string;
  decisions: OptimizationDecision[];
}

export interface ProfileSnapshot {
  totalEstimatedSavings: number;
  listsCreated: number;
  receiptsShared: number;
  invalidPromotionReports: number;
}

export interface AdminQueueIssue {
  id: string;
  stage: string;
  message: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AdminMetric {
  id: string;
  label: string;
  value: string;
  support: string;
}
