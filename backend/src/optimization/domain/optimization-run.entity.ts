export interface OptimizationRunEntity {
  id: string;
  shoppingListId: string;
  userId: string;
  mode:
    | 'local'
    | 'global_unique'
    | 'global_full'
    | 'local_unique'
    | 'local_multi'
    | 'global_multi';
  regionId: string;
  userLocationPreferenceId?: string | null;
  coverageRadiusKm?: number;
  candidateEstablishmentCount?: number;
  preferredEstablishmentId?: string | null;
  jobId?: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  coverageStatus: 'complete' | 'partial' | 'none';
  totalEstimatedCost?: number;
  estimatedSavings?: number;
  summary?: string;
  explanationPayload?: unknown;
  createdAt: string;
  completedAt?: string;
}
