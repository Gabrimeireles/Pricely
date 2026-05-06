export interface ReceiptLineItemInput {
  rawProductName: string;
  ean?: string;
  quantity?: number;
  unitPrice: number;
  originalUnitPrice?: number;
  promotionalUnitPrice?: number;
  currency?: string;
  packageSize?: string;
}

export interface ReceiptIngestionRequest {
  storeName?: string;
  storeCnpj?: string;
  purchaseDate?: string;
  sourceType?:
    | 'manual_entry'
    | 'qr_code_url'
    | 'qr_code_image'
    | 'pdf_upload'
    | 'image_parse'
    | 'structured_provider';
  qrCodeUrl?: string;
  accessKey?: string;
  uploadedFile?: ReceiptUploadedFileMetadata;
  items?: ReceiptLineItemInput[];
}

export interface ReceiptRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  storeCnpj?: string;
  accessKey?: string;
  sefazUrl?: string;
  purchaseDate?: string;
  parseStatus: 'queued' | 'parsed' | 'partial' | 'failed';
  confidenceScore?: number;
  jobId?: string;
  processingStatus?: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
  dataNotice: string;
}

export interface ReceiptUploadedFileMetadata {
  storageKey: string;
  originalFilename?: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}
