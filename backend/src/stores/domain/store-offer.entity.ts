export type StoreOfferAvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'uncertain';

export interface StoreOfferEntity {
  id: string;
  catalogProductId?: string;
  productVariantId?: string;
  brandName?: string;
  variantName?: string;
  storeId: string;
  storeName: string;
  canonicalName: string;
  matchingCanonicalNames?: string[];
  displayName: string;
  price: number;
  basePrice?: number;
  promotionalPrice?: number;
  quantityContext?: string;
  availabilityStatus: StoreOfferAvailabilityStatus;
  confidenceScore: number;
  trustFactor?: number;
  trustLevel?: 'high' | 'medium' | 'low';
  trustEvidenceCount?: number;
  trustFreshnessDays?: number;
  trustLastValidatedAt?: string;
  trustExplanation?: string;
  sourceReceiptLineItemId: string;
  observedAt: string;
}
