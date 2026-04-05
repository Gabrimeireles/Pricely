export const RECEIPT_PROCESSING_QUEUE = 'RECEIPT_PROCESSING_QUEUE';
export const OPTIMIZATION_QUEUE = 'OPTIMIZATION_QUEUE';

export interface ReceiptProcessingJob {
  receiptRecordId: string;
}

export interface OptimizationJob {
  shoppingListId: string;
  optimizationResultId: string;
}
