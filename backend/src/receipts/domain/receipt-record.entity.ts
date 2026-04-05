export type ReceiptParseStatus = 'parsed' | 'partial' | 'failed';

export interface ReceiptRecordEntity {
  id: string;
  storeId: string;
  storeName: string;
  purchaseDate?: string;
  sourceType: 'manual_entry' | 'image_parse' | 'import';
  parseStatus: ReceiptParseStatus;
  confidenceScore: number;
  rawSourceReference?: string;
  lineItems: ReceiptLineItemEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptLineItemEntity {
  id: string;
  receiptRecordId: string;
  rawProductName: string;
  normalizedName: string;
  brand?: string;
  packageSize?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  matchConfidence: number;
}
