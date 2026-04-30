export interface UserProfileStats {
  totalEstimatedSavings: number;
  shoppingListsCount: number;
  completedOptimizationRuns: number;
  contributionsCount: number;
  receiptSubmissionsCount: number;
  offerReportsCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegionSlug: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profileStats: UserProfileStats;
}
