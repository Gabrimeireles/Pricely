export interface AdminMetricsContract {
  activeUsers: number;
  shoppingListsCount: number;
  optimizationRunsCount: number;
  activeRegions: number;
  activeEstablishments: number;
  activeOffers: number;
  productCount: number;
  queuedJobs: number;
  globalEstimatedSavings: number;
}

export interface AdminQueueHealthContract {
  queuedJobs: number;
  runningJobs: number;
  failedJobs: number;
  completedJobs: number;
  jobsByStatus: Record<string, number>;
  queues: string[];
  recentFailures: Array<{
    queueName: string;
    status: string;
    failureReason?: string | null;
  }>;
}

export interface AdminShoppingListAuditContract {
  id: string;
  name: string;
  status: 'draft' | 'ready' | 'archived';
  updatedAt: string;
  itemCount: number;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  city?: string;
  latestOptimization: {
    id: string;
    mode: 'local' | 'global_unique' | 'global_full';
    status: 'queued' | 'running' | 'completed' | 'failed';
    estimatedSavings: number;
    totalEstimatedCost: number;
    coverageStatus: 'complete' | 'partial' | 'none';
    createdAt: string;
    completedAt?: string;
  } | null;
}
