import type {
  OptimizationModeId,
  ProfileSnapshot,
  ShoppingList,
} from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type AuthSessionResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
    preferredRegionSlug: string | null;
    profileStats: {
      totalEstimatedSavings: number;
      shoppingListsCount: number;
      completedOptimizationRuns: number;
      contributionsCount: number;
      receiptSubmissionsCount: number;
      offerReportsCount: number;
    };
    entitlement?: {
      plan: 'free' | 'premium';
      status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
      availableOptimizationTokens: number;
      monthlyFreeOptimizationTokens: number;
      billingEnabled: boolean;
      checkoutEnabled: boolean;
    };
  };
};

type ShoppingListApiResponse = {
  id: string;
  name: string;
  preferredRegionId?: string;
  status: 'draft' | 'ready' | 'archived';
  lastMode: OptimizationModeId;
  latestEstimatedSavings: number;
  latestOptimizationStatus?: 'queued' | 'running' | 'completed' | 'failed';
  latestOptimizedAt?: string;
  completedAt?: string;
  paidTotal?: number;
  items: Array<{
    id: string;
    requestedName: string;
    catalogProductId?: string;
    lockedProductVariantId?: string;
    optimizedProductVariantId?: string;
    optimizedFromBrandPreferenceMode?: 'any' | 'preferred' | 'exact';
    optimizedAt?: string;
    brandPreferenceMode?: 'any' | 'preferred' | 'exact';
    preferredBrandNames?: string[];
    imageUrl?: string;
    quantity?: number;
    unitLabel?: string;
    purchaseStatus?: 'pending' | 'purchased';
    resolutionStatus: 'unresolved' | 'matched' | 'partial' | 'missing';
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type OptimizationResultApiResponse = {
  id: string;
  shoppingListId: string;
  mode: OptimizationModeId;
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalEstimatedCost?: number;
  estimatedSavings?: number;
  coverageStatus: 'complete' | 'partial' | 'none';
  explanationSummary?: string;
  createdAt: string;
  completedAt?: string;
  selections: Array<{
    id?: string;
    shoppingListItemId: string;
    shoppingListItemName: string;
    selectedOfferName?: string;
    selectedVariantName?: string;
    selectedPackageLabel?: string;
    selectedVariantImageUrl?: string;
    establishmentName?: string;
    establishmentNeighborhood?: string;
    distanceKm?: number;
    estimatedCost?: number;
    priceAmount?: number;
    comparisonPriceAmount?: number;
    regionalAveragePriceAmount?: number;
    savingsVsComparison?: number;
    sourceLabel?: string;
    observedAt?: string;
    trustFactor?: number;
    trustLevel?: 'high' | 'medium' | 'low';
    trustEvidenceCount?: number;
    trustFreshnessDays?: number;
    trustLastValidatedAt?: string;
    trustExplanation?: string;
    selectionStatus: 'selected' | 'missing' | 'review';
    confidenceNotice?: string;
    decisionReason?: string;
    rejectedReason?: string;
  }>;
};

type OptimizationRunAcceptedResponse = {
  id: string;
  jobId: string;
  shoppingListId: string;
  mode: OptimizationModeId;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queuedAt: string;
};

type PublicRegionApiResponse = {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  implantationStatus: 'active' | 'activating' | 'inactive';
  activeEstablishmentCount: number;
  offerCoverageStatus: 'live' | 'collecting_data';
  establishments?: Array<{
    id: string;
    brandName: string;
    unitName: string;
    neighborhood: string;
    cityName: string;
    offerCount: number;
  }>;
};

type PublicImpactResponse = {
  totalEstimatedSavings: number;
  optimizedListsCount: number;
};

type CityInclusionRequestResponse = {
  id: string;
  cityName: string;
  stateCode: string;
  status: 'requested' | 'reviewed' | 'planned' | 'rejected';
  createdAt: string;
};

type RegionOffersApiResponse = {
  region: {
    id: string;
    slug: string;
    name: string;
    stateCode: string;
  };
  activeEstablishmentCount: number;
  offerCoverageStatus: 'live' | 'collecting_data';
  offers: RegionalOfferApiResponse[];
  groupedOffers?: RegionalOfferGroupApiResponse[];
};

type RegionalOfferApiResponse = {
  id: string;
  catalogProductId: string;
  productVariantId: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  displayName: string;
  packageLabel: string;
  priceAmount: number;
  basePriceAmount?: number;
  promotionalPriceAmount?: number;
  savingsVsRegionalAverage?: number;
  regionalAveragePriceAmount?: number;
  comparisonPriceAmount?: number;
  savingsVsComparison?: number;
  observedAt: string;
  sourceLabel: string;
  storeName: string;
  neighborhood: string;
  confidenceLevel: 'high' | 'medium' | 'low';
};

type RegionalOfferGroupApiResponse = {
  id: string;
  catalogProductId: string;
  productVariantId: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  packageLabel: string;
  bestOffer: RegionalOfferApiResponse;
  alternativeOffers: RegionalOfferApiResponse[];
  offers: RegionalOfferApiResponse[];
  establishmentCount: number;
  cheapestPriceAmount: number;
  secondCheapestPriceAmount?: number;
  savingsVsSecondCheapest?: number;
  averagePriceAmount: number;
  highestPriceAmount: number;
};

type OfferDetailApiResponse = {
  id: string;
  region: {
    id: string;
    slug: string;
    name: string;
    stateCode: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
  };
  variant?: {
    id: string;
    displayName: string;
    brandName?: string;
    packageLabel?: string;
  };
  activeOffer: {
    id: string;
    displayName: string;
    packageLabel: string;
    priceAmount: number;
    basePriceAmount?: number;
    promotionalPriceAmount?: number;
    regionalAveragePriceAmount?: number;
    comparisonPriceAmount?: number;
    savingsVsComparison?: number;
    observedAt: string;
    sourceLabel: string;
    storeName: string;
    neighborhood: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  alternativeOffers: Array<{
    id: string;
    storeName: string;
    neighborhood: string;
    packageLabel: string;
    priceAmount: number;
    basePriceAmount?: number;
    promotionalPriceAmount?: number;
    observedAt: string;
    sourceLabel: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
};

type CatalogProductSearchResponse = {
  id: string;
  slug: string;
  name: string;
  category: string;
  defaultUnit?: string | null;
  imageUrl?: string | null;
  productVariants: Array<{
    id: string;
    displayName: string;
    brandName?: string | null;
    packageLabel?: string | null;
    imageUrl?: string | null;
  }>;
};

type ProductVariantResponse = {
  id: string;
  catalogProductId: string;
  slug?: string;
  displayName: string;
  brandName?: string | null;
  variantLabel?: string | null;
  packageLabel?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
};

type AdminMetricsResponse = {
  activeUsers: number;
  shoppingListsCount: number;
  optimizationRunsCount: number;
  activeRegions: number;
  activeEstablishments: number;
  activeOffers: number;
  productCount: number;
  queuedJobs: number;
  globalEstimatedSavings: number;
};

type AdminProcessingJobResponse = {
  id: string;
  queueName: string;
  jobType: string;
  resourceType: string;
  resourceId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
  attemptCount: number;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  owner?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  shoppingList?: {
    id: string;
    name: string;
  } | null;
  optimizationRun?: {
    id: string;
    mode: OptimizationModeId;
    status: 'queued' | 'running' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
  } | null;
  receiptRecord?: {
    id: string;
    storeName?: string | null;
    storeCnpj?: string | null;
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
    reviewReason?: string | null;
    purchaseDate?: string;
  } | null;
};

type AdminProcessingJobDetailResponse = AdminProcessingJobResponse & {
  optimizationRun?:
    | (NonNullable<AdminProcessingJobResponse['optimizationRun']> & {
        totalEstimatedCost: number;
        estimatedSavings: number;
        coverageStatus: 'complete' | 'partial' | 'none';
        summary?: string | null;
        selections: Array<{
          id: string;
          shoppingListItemId: string;
          shoppingListItemName: string;
          status: 'selected' | 'review' | 'missing';
          estimatedCost: number;
          confidenceNotice?: string | null;
          offer?: {
            id: string;
            displayName: string;
            variantName: string;
            establishmentName: string;
            neighborhood: string;
            priceAmount: number;
            confidenceLevel?: 'high' | 'medium' | 'low';
            sourceType?: string;
            sourceLabel: string;
            observedAt: string;
            receiptEvidence?: {
              id: string;
              moderationStatus:
                | 'pending'
                | 'accepted'
                | 'quarantined'
                | 'duplicate'
                | 'rejected';
              trustLevel:
                | 'untrusted'
                | 'pending_review'
                | 'trusted'
                | 'rejected';
              reviewReason?: string | null;
            } | null;
          } | null;
        }>;
      })
    | null;
  receiptRecord?:
    | (NonNullable<AdminProcessingJobResponse['receiptRecord']> & {
        lineItems: Array<{
          id: string;
          rawProductName: string;
          normalizedName: string;
          ean?: string | null;
          quantity: number;
          unitPrice: number;
          originalUnitPrice?: number;
          promotionalUnitPrice?: number;
          matchConfidence: number;
        }>;
      })
    | null;
};

type AdminReceiptProcessingResponse = {
  id: string;
  storeName?: string | null;
  storeCnpj?: string | null;
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
  reviewReason?: string | null;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  processingJob?: {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
    attemptCount: number;
    failureReason?: string | null;
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
    accessKey?: string | null;
    sefazUrl?: string | null;
    rawReference?: string | null;
    purchaseDate?: string | null;
    lineItemCount: number;
    totalLineAmount: number;
  };
  lineItems: Array<{
    id: string;
    rawProductName: string;
    normalizedName: string;
    ean?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    originalUnitPrice?: number | null;
    promotionalUnitPrice?: number | null;
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
      brandName?: string | null;
      establishmentName: string;
      neighborhood: string;
      displayName: string;
      packageLabel: string;
      priceAmount: number;
      observedAt: string;
      comparison: {
        previousPriceAmount?: number | null;
        newPriceAmount: number;
        deltaAmount?: number | null;
        direction: 'new' | 'up' | 'down' | 'same';
        previousObservedAt?: string | null;
      };
    }>;
  }>;
};

type ReceiptSubmissionResponse = {
  id: string;
  storeName?: string;
  storeCnpj?: string;
  parseStatus: 'queued' | 'parsed' | 'partial' | 'failed';
  trustLevel?: 'untrusted' | 'pending_review' | 'trusted' | 'rejected';
  moderationStatus?:
    | 'pending'
    | 'accepted'
    | 'quarantined'
    | 'duplicate'
    | 'rejected';
  rewardEligibilityStatus?:
    | 'disabled'
    | 'ineligible'
    | 'eligible_pending'
    | 'granted';
  rewardPoints?: number;
  rewardOptimizationTokens?: number;
  rewardMessage?: string;
  reviewReason?: string;
  jobId?: string;
  processingStatus?:
    | 'waiting_manual_release'
    | 'queued'
    | 'running'
    | 'completed'
    | 'failed'
    | 'retrying';
};

type AdminQueueHealthResponse = {
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
};

type AdminRegionResponse = {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  implantationStatus: 'active' | 'activating' | 'inactive';
  publicSortOrder: number;
  activeEstablishmentsCount: number;
  establishments: Array<{
    id: string;
    brandName: string;
    unitName: string;
    neighborhood: string;
    cityName: string;
    isActive: boolean;
    auditedProductsCount: number;
  }>;
};

type AdminShoppingListAuditResponse = {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  itemCount: number;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  city?: string;
  latestOptimization?: {
    id: string;
    mode: OptimizationModeId;
    status: string;
    estimatedSavings: number;
    totalEstimatedCost: number;
    coverageStatus: string;
    createdAt: string;
    completedAt?: string;
  } | null;
};

type AdminUserResponse = {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegion?: {
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
    billingEnabled: boolean;
    checkoutEnabled: boolean;
    lastPaymentAt: string | null;
    lastPaymentStatus: 'billing_disabled' | 'none' | 'paid' | 'failed';
  };
  latestOptimization?: {
    id: string;
    mode: OptimizationModeId;
    status: 'queued' | 'running' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
  } | null;
};

type UserLocationPreferenceResponse = {
  id: string;
  regionId: string;
  regionSlug: string;
  regionName: string;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  postalCode?: string | null;
  coverageRadiusKm: number;
  activeEstablishmentCount: number;
  isDefault: boolean;
  locationSource: 'manual' | 'browser_geolocation' | 'postal_code_fallback';
  createdAt: string;
  updatedAt: string;
};

type CoveragePreviewResponse = {
  regionId: string;
  coverageRadiusKm: number;
  activeEstablishmentCount: number;
  fallbackUsed: boolean;
  fallbackReason?: 'missing_coordinates' | 'postal_code_only';
  establishments: Array<{
    id: string;
    brandName: string;
    unitName: string;
    neighborhood: string;
    postalCode?: string | null;
    distanceKm?: number | null;
  }>;
};

type AdminEstablishmentResponse = {
  id: string;
  brandName: string;
  unitName: string;
  cnpj: string;
  cityName: string;
  neighborhood: string;
  regionId: string;
  isActive: boolean;
  region: {
    id: string;
    name: string;
    slug: string;
    stateCode: string;
  };
};

type AdminProductResponse = {
  id: string;
  slug: string;
  name: string;
  category: string;
  defaultUnit?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  aliases: Array<{
    id: string;
    alias: string;
  }>;
  productVariants: Array<{
    id: string;
    displayName: string;
    brandName?: string | null;
    packageLabel?: string | null;
    imageUrl?: string | null;
  }>;
  _count: {
    productOffers: number;
  };
};

type AdminProductVariantResponse = {
  id: string;
  catalogProductId: string;
  slug?: string | null;
  displayName: string;
  brandName?: string | null;
  variantLabel?: string | null;
  packageLabel?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
};

type AdminOfferResponse = {
  id: string;
  displayName: string;
  packageLabel: string;
  priceAmount: number | string;
  basePriceAmount?: number | string | null;
  promotionalPriceAmount?: number | string | null;
  availabilityStatus: string;
  confidenceLevel: string;
  observedAt: string;
  isActive: boolean;
  catalogProduct: {
    id: string;
    name: string;
  };
  productVariant: {
    id: string;
    displayName: string;
    brandName?: string | null;
    imageUrl?: string | null;
    packageLabel?: string | null;
  };
  establishment: {
    id: string;
    unitName: string;
    neighborhood: string;
    region: {
      id: string;
      slug: string;
      name: string;
      stateCode: string;
    };
  };
};

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormDataBody =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (!isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await response.text();
    let message = payload;

    try {
      const parsed = JSON.parse(payload) as {
        message?: string | string[];
        error?: { message?: string | string[] } | string;
      };
      const parsedMessage =
        typeof parsed.error === 'object' ? parsed.error.message : parsed.message;
      message = Array.isArray(parsedMessage)
        ? parsedMessage.join('; ')
        : parsedMessage || message;
    } catch {
      message = payload;
    }

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function signIn(email: string, password: string) {
  return apiFetch<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
) {
  return apiFetch<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function fetchMe(token: string) {
  return apiFetch<AuthSessionResponse['user']>('/auth/me', {}, token);
}

export async function updatePreferredRegion(token: string, regionSlug: string) {
  return apiFetch<AuthSessionResponse['user']>(
    '/auth/preferred-region',
    {
      method: 'PATCH',
      body: JSON.stringify({ regionSlug }),
    },
    token,
  );
}

export async function fetchPublicRegions() {
  return apiFetch<PublicRegionApiResponse[]>('/regions');
}

export async function fetchPublicImpact() {
  return apiFetch<PublicImpactResponse>('/regions/impact');
}

export async function requestCityInclusion(input: {
  cityName: string;
  stateCode: string;
  contactName?: string;
  contactEmail?: string;
  message?: string;
}) {
  return apiFetch<CityInclusionRequestResponse>('/regions/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function submitReceipt(
  token: string,
  input: {
    storeName?: string;
    storeCnpj?: string;
    purchaseDate?: string;
    qrCodeUrl?: string;
    accessKey?: string;
    items?: Array<{
      rawProductName: string;
      ean?: string;
      quantity?: number;
      unitPrice: number;
      originalUnitPrice?: number;
      promotionalUnitPrice?: number;
      packageSize?: string;
    }>;
  },
) {
  return apiFetch<ReceiptSubmissionResponse>(
    '/receipts',
    {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        sourceType: input.qrCodeUrl ? 'qr_code_url' : 'manual_entry',
      }),
    },
    token,
  );
}

export async function fetchRegionOffers(regionSlug: string) {
  return apiFetch<RegionOffersApiResponse>(`/regions/${regionSlug}/offers`);
}

export async function fetchOfferDetail(offerId: string) {
  return apiFetch<OfferDetailApiResponse>(`/offers/${offerId}`);
}

export async function searchCatalogProducts(query: string) {
  return apiFetch<CatalogProductSearchResponse[]>(
    `/catalog-products/search?q=${encodeURIComponent(query)}`,
  );
}

export async function fetchCatalogProductVariants(catalogProductId: string) {
  return apiFetch<ProductVariantResponse[]>(
    `/catalog-products/${catalogProductId}/variants`,
  );
}

export async function fetchShoppingLists(token: string) {
  return apiFetch<ShoppingListApiResponse[]>('/shopping-lists', {}, token);
}

export async function fetchShoppingList(token: string, listId: string) {
  return apiFetch<ShoppingListApiResponse>(
    `/shopping-lists/${listId}`,
    {},
    token,
  );
}

export async function createShoppingList(
  token: string,
  input: {
    name: string;
    preferredRegionId?: string;
    lastMode?: OptimizationModeId;
  },
) {
  return apiFetch<ShoppingListApiResponse>(
    '/shopping-lists',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function replaceShoppingList(
  token: string,
  listId: string,
  input: {
    name: string;
    preferredRegionId?: string;
    lastMode?: OptimizationModeId;
    items: Array<{
      requestedName: string;
      catalogProductId?: string;
      lockedProductVariantId?: string;
      brandPreferenceMode?: 'any' | 'preferred' | 'exact';
      preferredBrandNames?: string[];
      purchaseStatus?: 'pending' | 'purchased';
      quantity?: number;
      unitLabel?: string;
      notes?: string;
    }>;
  },
) {
  return apiFetch<ShoppingListApiResponse>(
    `/shopping-lists/${listId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateShoppingListItemPurchaseStatus(
  token: string,
  listId: string,
  itemId: string,
  purchaseStatus: 'pending' | 'purchased',
) {
  return apiFetch<ShoppingListApiResponse>(
    `/shopping-lists/${listId}/items/${itemId}/purchase-status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ purchaseStatus }),
    },
    token,
  );
}

export async function completeShoppingListCheckout(
  token: string,
  listId: string,
  paidTotal?: number,
) {
  return apiFetch<ShoppingListApiResponse>(
    `/shopping-lists/${listId}/checkout-completion`,
    {
      method: 'POST',
      body: JSON.stringify({ paidTotal }),
    },
    token,
  );
}

export async function reportShoppingListItemPriceMismatch(
  token: string,
  listId: string,
  itemId: string,
  input: {
    expectedPrice?: number;
    reportedPrice?: number;
    reason?: string;
  },
) {
  return apiFetch<{ id: string; createdAt: string }>(
    `/shopping-lists/${listId}/items/${itemId}/price-reports`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function fetchLocationPreferences(token: string) {
  return apiFetch<UserLocationPreferenceResponse[]>('/locations', {}, token);
}

export async function previewLocationCoverage(
  token: string,
  input: {
    regionId: string;
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    coverageRadiusKm?: number;
  },
) {
  return apiFetch<CoveragePreviewResponse>(
    '/locations/coverage-preview',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function createLocationPreference(
  token: string,
  input: {
    regionId: string;
    label: string;
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    coverageRadiusKm?: number;
    isDefault?: boolean;
    locationSource?: 'manual' | 'browser_geolocation' | 'postal_code_fallback';
  },
) {
  return apiFetch<UserLocationPreferenceResponse>(
    '/locations',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function runOptimization(
  token: string,
  listId: string,
  mode: OptimizationModeId,
  input?: {
    userLocationPreferenceId?: string;
    coverageRadiusKm?: number;
  },
) {
  await apiFetch<OptimizationRunAcceptedResponse>(
    `/shopping-lists/${listId}/optimize`,
    {
      method: 'POST',
      body: JSON.stringify({ mode, ...input }),
    },
    token,
  );

  return waitForOptimizationResult(token, listId);
}

export async function fetchLatestOptimization(token: string, listId: string) {
  return apiFetch<OptimizationResultApiResponse>(
    `/shopping-lists/${listId}/optimizations/latest`,
    {},
    token,
  );
}

async function waitForOptimizationResult(token: string, listId: string) {
  const deadline = Date.now() + 30000;
  let latest = await fetchLatestOptimization(token, listId);

  while (
    latest.status !== 'completed' &&
    latest.status !== 'failed' &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1000));
    latest = await fetchLatestOptimization(token, listId);
  }

  if (latest.status === 'failed') {
    throw new Error(
      latest.explanationSummary || 'Nao foi possivel processar esta lista.',
    );
  }

  return latest;
}

export async function fetchAdminMetrics(token: string) {
  return apiFetch<AdminMetricsResponse>('/admin/metrics', {}, token);
}

export async function fetchAdminProcessingJobs(token: string) {
  return apiFetch<AdminProcessingJobResponse[]>(
    '/admin/processing-jobs',
    {},
    token,
  );
}

export async function fetchAdminProcessingJobDetail(token: string, id: string) {
  return apiFetch<AdminProcessingJobDetailResponse>(
    `/admin/processing-jobs/${id}`,
    {},
    token,
  );
}

export async function fetchAdminReceiptProcessing(token: string) {
  return apiFetch<AdminReceiptProcessingResponse[]>(
    '/admin/receipt-processing',
    {},
    token,
  );
}

export async function releaseAdminReceiptProcessing(token: string, id: string) {
  return apiFetch<ReceiptSubmissionResponse>(
    `/admin/receipt-processing/${id}/release`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token,
  );
}

export async function reprocessAdminReceiptProcessing(
  token: string,
  id: string,
) {
  return apiFetch<ReceiptSubmissionResponse>(
    `/admin/receipt-processing/${id}/reprocess`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token,
  );
}

export async function rejectAdminReceiptProcessing(
  token: string,
  id: string,
  reason = 'manual_admin_rejection',
) {
  return apiFetch<ReceiptSubmissionResponse>(
    `/admin/receipt-processing/${id}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    token,
  );
}

export async function fetchAdminQueueHealth(token: string) {
  return apiFetch<AdminQueueHealthResponse>('/admin/queue-health', {}, token);
}

export async function fetchAdminRegions(token: string) {
  return apiFetch<AdminRegionResponse[]>('/admin/regions', {}, token);
}

export async function fetchAdminShoppingLists(token: string) {
  return apiFetch<AdminShoppingListAuditResponse[]>(
    '/admin/shopping-lists',
    {},
    token,
  );
}

export async function fetchAdminUsers(token: string) {
  return apiFetch<AdminUserResponse[]>('/admin/users', {}, token);
}

export async function setAdminUserPremium(
  token: string,
  id: string,
  enabled: boolean,
) {
  return apiFetch<AdminUserResponse>(
    `/admin/users/${id}/premium`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    },
    token,
  );
}

export async function grantAdminUserTokens(
  token: string,
  id: string,
  input: { amount: number; reason?: string },
) {
  return apiFetch<AdminUserResponse>(
    `/admin/users/${id}/tokens`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function createAdminRegion(
  token: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminRegionResponse>(
    '/admin/regions',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminRegion(
  token: string,
  id: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminRegionResponse>(
    `/admin/regions/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function fetchAdminEstablishments(token: string) {
  return apiFetch<AdminEstablishmentResponse[]>(
    '/admin/establishments',
    {},
    token,
  );
}

export async function createAdminEstablishment(
  token: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminEstablishmentResponse>(
    '/admin/establishments',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminEstablishment(
  token: string,
  id: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminEstablishmentResponse>(
    `/admin/establishments/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function fetchAdminProducts(token: string) {
  return apiFetch<AdminProductResponse[]>('/admin/catalog-products', {}, token);
}

export async function createAdminProduct(
  token: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminProductResponse>(
    '/admin/catalog-products',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminProduct(
  token: string,
  id: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminProductResponse>(
    `/admin/catalog-products/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function deleteAdminProduct(token: string, id: string) {
  return apiFetch<AdminProductResponse>(
    `/admin/catalog-products/${id}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export async function uploadAdminProductImage(
  token: string,
  id: string,
  file: File,
) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<AdminProductResponse>(
    `/admin/catalog-products/${id}/image`,
    {
      method: 'POST',
      body: formData,
    },
    token,
  );
}

export async function fetchAdminProductVariants(token: string) {
  return apiFetch<AdminProductVariantResponse[]>(
    '/admin/product-variants',
    {},
    token,
  );
}

export async function createAdminProductVariant(
  token: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminProductVariantResponse>(
    '/admin/product-variants',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminProductVariant(
  token: string,
  id: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminProductVariantResponse>(
    `/admin/product-variants/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function deleteAdminProductVariant(token: string, id: string) {
  return apiFetch<AdminProductVariantResponse>(
    `/admin/product-variants/${id}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export async function uploadAdminProductVariantImage(
  token: string,
  id: string,
  file: File,
) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<AdminProductVariantResponse>(
    `/admin/product-variants/${id}/image`,
    {
      method: 'POST',
      body: formData,
    },
    token,
  );
}

export async function fetchAdminOffers(token: string) {
  return apiFetch<AdminOfferResponse[]>('/admin/offers', {}, token);
}

export async function createAdminOffer(
  token: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminOfferResponse>(
    '/admin/offers',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminOffer(
  token: string,
  id: string,
  input: Record<string, unknown>,
) {
  return apiFetch<AdminOfferResponse>(
    `/admin/offers/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function mapProfile(user: AuthSessionResponse['user']): ProfileSnapshot {
  const entitlement = user.entitlement ?? {
    plan: 'free' as const,
    status: 'active' as const,
    availableOptimizationTokens: 0,
    monthlyFreeOptimizationTokens: 2,
    billingEnabled: false,
    checkoutEnabled: false,
  };

  return {
    totalEstimatedSavings: user.profileStats.totalEstimatedSavings,
    listsCreated: user.profileStats.shoppingListsCount,
    receiptsShared: user.profileStats.receiptSubmissionsCount,
    invalidPromotionReports: user.profileStats.offerReportsCount,
    entitlementPlan: entitlement.plan,
    entitlementStatus: entitlement.status,
    availableOptimizationTokens: entitlement.availableOptimizationTokens,
    monthlyFreeOptimizationTokens: entitlement.monthlyFreeOptimizationTokens,
    billingEnabled: entitlement.billingEnabled,
    checkoutEnabled: entitlement.checkoutEnabled,
  };
}

export function mapShoppingList(
  apiList: ShoppingListApiResponse,
): ShoppingList {
  return {
    id: apiList.id,
    name: apiList.name,
    cityId: apiList.preferredRegionId ?? '',
    lastMode: apiList.lastMode,
    updatedAt: apiList.updatedAt,
    expectedSavings: apiList.latestEstimatedSavings ?? 0,
    completedAt: apiList.completedAt,
    paidTotal: apiList.paidTotal,
    items: apiList.items.map((item) => ({
      id: item.id,
      name: item.requestedName,
      catalogProductId: item.catalogProductId,
      lockedProductVariantId: item.lockedProductVariantId,
      optimizedProductVariantId: item.optimizedProductVariantId,
      optimizedFromBrandPreferenceMode: item.optimizedFromBrandPreferenceMode,
      optimizedAt: item.optimizedAt,
      brandPreferenceMode: item.brandPreferenceMode ?? 'any',
      preferredBrandNames: item.preferredBrandNames ?? [],
      imageUrl: item.imageUrl,
      quantity: item.quantity ?? 1,
      unitLabel: item.unitLabel ?? 'un',
      note: item.notes,
      purchaseStatus: item.purchaseStatus ?? 'pending',
      status:
        item.resolutionStatus === 'matched'
          ? 'resolved'
          : item.resolutionStatus === 'partial'
            ? 'partial'
            : 'missing',
    })),
  };
}

export type {
  AdminShoppingListAuditResponse,
  AdminUserResponse,
  CityInclusionRequestResponse,
  CoveragePreviewResponse,
  AdminEstablishmentResponse,
  AdminMetricsResponse,
  AdminOfferResponse,
  AdminProductResponse,
  AdminProductVariantResponse,
  AdminProcessingJobResponse,
  AdminProcessingJobDetailResponse,
  AdminQueueHealthResponse,
  AdminReceiptProcessingResponse,
  AdminRegionResponse,
  OfferDetailApiResponse,
  OptimizationResultApiResponse,
  PublicRegionApiResponse,
  PublicImpactResponse,
  ProductVariantResponse,
  ReceiptSubmissionResponse,
  RegionOffersApiResponse,
  CatalogProductSearchResponse,
  UserLocationPreferenceResponse,
};
