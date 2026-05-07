import { type ReceiptIngestionRequest } from '../../common/contracts/receipt.contract';

export interface OcrReceiptExtractor {
  extract(input: ReceiptIngestionRequest): Promise<ReceiptIngestionRequest>;
}

export const OCR_RECEIPT_EXTRACTOR = Symbol('OCR_RECEIPT_EXTRACTOR');

export class UnsupportedOcrReceiptExtractor implements OcrReceiptExtractor {
  async extract(_input: ReceiptIngestionRequest): Promise<ReceiptIngestionRequest> {
    throw new Error('OCR receipt extractor is not configured');
  }
}
