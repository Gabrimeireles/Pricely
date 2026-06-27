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

export interface AdminNotificationDeliveryContract {
  id: string;
  notificationId: string;
  userId: string;
  channel: 'email' | 'push';
  status:
    | 'queued'
    | 'sending'
    | 'retrying'
    | 'delivered'
    | 'failed'
    | 'cancelled';
  attemptCount: number;
  maxAttempts: number;
  providerMessage: string | null;
  lastFailureReason: string | null;
  nextAttemptAt: string | null;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  canRetry: boolean;
  canCancel: boolean;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  notification: {
    id: string;
    type:
      | 'price_drop'
      | 'receipt_outcome'
      | 'optimization_ready'
      | 'optimization_failed';
    title: string;
    resourceType: string | null;
    resourceId: string | null;
    createdAt: string;
  };
  destination: {
    kind: 'email' | 'push';
    id: string;
    label: string;
    status: string;
    provider?: string;
  } | null;
}

export interface AdminNotificationDeliveryFiltersContract {
  channel?: 'email' | 'push';
  status:
    | 'all'
    | 'queued'
    | 'sending'
    | 'retrying'
    | 'delivered'
    | 'failed'
    | 'cancelled';
  notificationType:
    | 'all'
    | 'price_drop'
    | 'receipt_outcome'
    | 'optimization_ready'
    | 'optimization_failed';
  retryability: 'all' | 'retryable' | 'not_retryable';
  destination?: string;
  search?: string;
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

export interface AdminUserContract {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegion: {
    id: string;
    slug: string;
    name: string;
    stateCode: string;
  } | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    shoppingLists: number;
    optimizationRuns: number;
    receiptRecords: number;
    priceMismatchReports: number;
  };
  entitlement: {
    plan: 'free' | 'premium';
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
    source: string;
    availableOptimizationTokens: number | null;
    monthlyFreeOptimizationTokens: number;
    billingEnabled: false;
    checkoutEnabled: false;
    lastPaymentAt: string | null;
    lastPaymentStatus: 'billing_disabled' | 'none' | 'paid' | 'failed';
  };
  latestOptimization: {
    id: string;
    mode: 'local' | 'global_unique' | 'global_full';
    status: 'queued' | 'running' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
  } | null;
}

export interface AdminReceiptProcessingContract {
  id: string;
  storeName: string | null;
  storeCnpj: string | null;
  parseStatus: 'queued' | 'parsed' | 'partial' | 'failed';
  trustLevel: 'untrusted' | 'pending_review' | 'trusted' | 'rejected';
  moderationStatus:
    | 'pending'
    | 'accepted'
    | 'quarantined'
    | 'duplicate'
    | 'rejected';
  rewardEligibilityStatus:
    | 'disabled'
    | 'ineligible'
    | 'eligible_pending'
    | 'granted';
  reviewReason: string | null;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  processingJob: {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
    attemptCount: number;
    failureReason: string | null;
    updatedAt: string;
  } | null;
  quality: {
    lineItemCount: number;
    highConfidenceLineItemCount: number;
    averageMatchConfidence: number;
    usefulDataRatio: number;
  };
  reward: {
    points: number;
    optimizationTokens: number;
    label: string;
  };
  extractedPayload: {
    accessKey: string | null;
    sefazUrl: string | null;
    rawReference: string | null;
    purchaseDate: string | null;
    lineItemCount: number;
    totalLineAmount: number;
  };
  lineItems: Array<{
    id: string;
    rawProductName: string;
    normalizedName: string;
    ean: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    originalUnitPrice: number | null;
    promotionalUnitPrice: number | null;
    matchConfidence: number;
    matcherStatus:
      | 'matched_offer'
      | 'matched_name_only'
      | 'needs_product_review';
    makerAction:
      | 'offer_created'
      | 'link_existing_product'
      | 'create_or_match_product';
    offers: Array<{
      id: string;
      catalogProductName: string;
      variantName: string;
      brandName: string | null;
      establishmentName: string;
      neighborhood: string;
      displayName: string;
      packageLabel: string;
      priceAmount: number;
      observedAt: string;
      comparison: {
        previousPriceAmount: number | null;
        newPriceAmount: number;
        deltaAmount: number | null;
        direction: 'new' | 'up' | 'down' | 'same';
        previousObservedAt: string | null;
      };
    }>;
  }>;
}
