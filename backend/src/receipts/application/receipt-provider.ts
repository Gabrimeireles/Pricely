import { type ReceiptIngestionRequest } from '../../common/contracts/receipt.contract';

export interface ReceiptProvider {
  fetchByAccessKey(key: string): Promise<ReceiptIngestionRequest>;
}

export const RECEIPT_PROVIDER = Symbol('RECEIPT_PROVIDER');

export class UnsupportedReceiptProvider implements ReceiptProvider {
  async fetchByAccessKey(_key: string): Promise<ReceiptIngestionRequest> {
    throw new Error('Structured receipt provider is not configured');
  }
}
