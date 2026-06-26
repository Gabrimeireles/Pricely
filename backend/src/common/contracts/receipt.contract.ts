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
  storeAddressLine?: string;
  storeNeighborhood?: string;
  storePostalCode?: string;
  storeCityName?: string;
  storeStateCode?: string;
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
  storeAddressLine?: string;
  storeNeighborhood?: string;
  storePostalCode?: string;
  storeCityName?: string;
  storeStateCode?: string;
  accessKey?: string;
  sefazUrl?: string;
  purchaseDate?: string;
  parseStatus: 'queued' | 'parsed' | 'partial' | 'failed';
  confidenceScore?: number;
  trustLevel?: 'untrusted' | 'pending_review' | 'trusted' | 'rejected';
  moderationStatus?:
    | 'pending'
    | 'accepted'
    | 'quarantined'
    | 'duplicate'
    | 'rejected';
  rewardEligibilityStatus?:
    | 'disabled'
    | 'ineligible'
    | 'eligible_pending'
    | 'granted';
  rewardPoints?: number;
  rewardOptimizationTokens?: number;
  rewardMessage?: string;
  reviewReason?: string;
  jobId?: string;
  processingStatus?:
    | 'waiting_manual_release'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'retrying'
    | 'cancelled';
  dataNotice: string;
}

export interface ReceiptUploadedFileMetadata {
  storageKey: string;
  originalFilename?: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}
