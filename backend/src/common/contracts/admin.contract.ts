export interface AdminMetricsContract {
  activeUsers: number;
  shoppingListsCount: number;
  optimizationRunsCount: number;
  activeRegions: number;
  activeEstablishments: number;
  activeOffers: number;
  productCount: number;
  queuedJobs: number;
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
