export interface ProfileStats {
  totalEstimatedSavings: number;
  shoppingListsCount: number;
  completedOptimizationRuns: number;
  contributionsCount: number;
  receiptSubmissionsCount: number;
  offerReportsCount: number;
}

export interface UserEntitlementProfile {
  plan: 'free' | 'premium';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
  availableOptimizationTokens: number;
  monthlyFreeOptimizationTokens: number;
  billingEnabled: boolean;
  checkoutEnabled: boolean;
}

export interface AuthenticatedUserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegionSlug: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profileStats: ProfileStats;
  entitlement: UserEntitlementProfile;
}

export interface AuthSessionContract {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  user: AuthenticatedUserProfile;
}
