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
  displayName: string;
  price: number;
  basePrice?: number;
  promotionalPrice?: number;
  quantityContext?: string;
  availabilityStatus: StoreOfferAvailabilityStatus;
  confidenceScore: number;
  sourceReceiptLineItemId: string;
  observedAt: string;
}
