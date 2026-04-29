export interface OptimizationRunEntity {
  id: string;
  shoppingListId: string;
  userId: string;
  mode: 'local' | 'global_unique' | 'global_full';
  regionId: string;
  preferredEstablishmentId?: string | null;
  jobId?: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  coverageStatus: 'complete' | 'partial' | 'none';
  totalEstimatedCost?: number;
  estimatedSavings?: number;
  summary?: string;
  createdAt: string;
  completedAt?: string;
}
