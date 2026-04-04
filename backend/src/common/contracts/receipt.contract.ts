export interface ReceiptLineItemInput {
  rawProductName: string;
  quantity?: number;
  unitPrice: number;
  currency?: string;
  packageSize?: string;
}

export interface ReceiptIngestionRequest {
  storeName: string;
  purchaseDate?: string;
  sourceType?: 'manual_entry' | 'image_parse' | 'import';
  items: ReceiptLineItemInput[];
}

export interface ReceiptRecord {
  id: string;
  storeId?: string;
  purchaseDate?: string;
  parseStatus: 'parsed' | 'partial' | 'failed';
  confidenceScore?: number;
}
