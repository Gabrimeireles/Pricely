export type ReceiptParseStatus = 'queued' | 'parsed' | 'partial' | 'failed';

export interface ReceiptRecordEntity {
  id: string;
  userId: string;
  storeId?: string;
  storeName?: string;
  storeCnpj?: string;
  accessKey?: string;
  sefazUrl?: string;
  purchaseDate?: string;
  sourceType:
    | 'manual_entry'
    | 'qr_code_url'
    | 'qr_code_image'
    | 'pdf_upload'
    | 'image_parse'
    | 'structured_provider';
  parseStatus: ReceiptParseStatus;
  confidenceScore: number;
  rawSourceReference?: string;
  processingJobId?: string;
  processingStatus?: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
  processingLogs: string[];
  lineItems: ReceiptLineItemEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptLineItemEntity {
  id: string;
  receiptRecordId: string;
  ean?: string;
  rawProductName: string;
  normalizedName: string;
  brand?: string;
  packageSize?: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice?: number;
  promotionalUnitPrice?: number;
  currency: string;
  matchConfidence: number;
}
