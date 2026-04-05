export type StoreOfferAvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'uncertain';

export interface StoreOfferEntity {
  id: string;
  storeId: string;
  storeName: string;
  canonicalName: string;
  displayName: string;
  price: number;
  quantityContext?: string;
  availabilityStatus: StoreOfferAvailabilityStatus;
  confidenceScore: number;
  sourceReceiptLineItemId: string;
  observedAt: string;
}
