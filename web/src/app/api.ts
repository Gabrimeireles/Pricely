import type { OptimizationModeId, ProfileSnapshot, ShoppingList } from './types';

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
  items: Array<{
    id: string;
    requestedName: string;
    catalogProductId?: string;
    lockedProductVariantId?: string;
    brandPreferenceMode?: 'any' | 'exact';
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
    establishmentName?: string;
    establishmentNeighborhood?: string;
    estimatedCost?: number;
    priceAmount?: number;
    sourceLabel?: string;
    observedAt?: string;
    selectionStatus: 'selected' | 'missing' | 'review';
    confidenceNotice?: string;
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
};

type PublicImpactResponse = {
  totalEstimatedSavings: number;
  optimizedListsCount: number;
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
  offers: Array<{
    id: string;
    catalogProductId: string;
    productVariantId: string;
    productName: string;
    variantName?: string;
    imageUrl?: string;
    displayName: string;
    packageLabel: string;
    priceAmount: number;
    observedAt: string;
    sourceLabel: string;
    storeName: string;
    neighborhood: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
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
};

type AdminProcessingJobDetailResponse = AdminProcessingJobResponse & {
  optimizationRun?: (NonNullable<AdminProcessingJobResponse['optimizationRun']> & {
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
        sourceLabel: string;
        observedAt: string;
      } | null;
    }>;
  }) | null;
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
    const message = await response.text();
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
  return apiFetch<ShoppingListApiResponse>(`/shopping-lists/${listId}`, {}, token);
}

export async function createShoppingList(
  token: string,
  input: { name: string; preferredRegionId?: string; lastMode?: OptimizationModeId },
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
      brandPreferenceMode?: 'any' | 'exact';
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

export async function runOptimization(
  token: string,
  listId: string,
  mode: OptimizationModeId,
) {
  await apiFetch<OptimizationRunAcceptedResponse>(
    `/shopping-lists/${listId}/optimize`,
    {
      method: 'POST',
      body: JSON.stringify({ mode }),
    },
    token,
  );

  return waitForOptimizationResult(token, listId);
}

export async function fetchLatestOptimization(
  token: string,
  listId: string,
) {
  return apiFetch<OptimizationResultApiResponse>(
    `/shopping-lists/${listId}/optimizations/latest`,
    {},
    token,
  );
}

async function waitForOptimizationResult(
  token: string,
  listId: string,
) {
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
    throw new Error(latest.explanationSummary || 'Nao foi possivel processar esta lista.');
  }

  return latest;
}

export async function fetchAdminMetrics(token: string) {
  return apiFetch<AdminMetricsResponse>('/admin/metrics', {}, token);
}

export async function fetchAdminProcessingJobs(token: string) {
  return apiFetch<AdminProcessingJobResponse[]>('/admin/processing-jobs', {}, token);
}

export async function fetchAdminProcessingJobDetail(token: string, id: string) {
  return apiFetch<AdminProcessingJobDetailResponse>(`/admin/processing-jobs/${id}`, {}, token);
}

export async function fetchAdminQueueHealth(token: string) {
  return apiFetch<AdminQueueHealthResponse>('/admin/queue-health', {}, token);
}

export async function fetchAdminRegions(token: string) {
  return apiFetch<AdminRegionResponse[]>('/admin/regions', {}, token);
}

export async function fetchAdminShoppingLists(token: string) {
  return apiFetch<AdminShoppingListAuditResponse[]>('/admin/shopping-lists', {}, token);
}

export async function createAdminRegion(token: string, input: Record<string, unknown>) {
  return apiFetch<AdminRegionResponse>(
    '/admin/regions',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function updateAdminRegion(token: string, id: string, input: Record<string, unknown>) {
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
  return apiFetch<AdminEstablishmentResponse[]>('/admin/establishments', {}, token);
}

export async function createAdminEstablishment(token: string, input: Record<string, unknown>) {
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

export async function createAdminProduct(token: string, input: Record<string, unknown>) {
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
  return apiFetch<AdminProductVariantResponse[]>('/admin/product-variants', {}, token);
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

export async function createAdminOffer(token: string, input: Record<string, unknown>) {
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
  return {
    totalEstimatedSavings: user.profileStats.totalEstimatedSavings,
    listsCreated: user.profileStats.shoppingListsCount,
    receiptsShared: user.profileStats.receiptSubmissionsCount,
    invalidPromotionReports: user.profileStats.offerReportsCount,
  };
}

export function mapShoppingList(apiList: ShoppingListApiResponse): ShoppingList {
  return {
    id: apiList.id,
    name: apiList.name,
    cityId: apiList.preferredRegionId ?? '',
    lastMode: apiList.lastMode,
    updatedAt: apiList.updatedAt,
    expectedSavings: apiList.latestEstimatedSavings ?? 0,
    items: apiList.items.map((item) => ({
      id: item.id,
      name: item.requestedName,
      catalogProductId: item.catalogProductId,
      lockedProductVariantId: item.lockedProductVariantId,
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
  AdminEstablishmentResponse,
  AdminMetricsResponse,
  AdminOfferResponse,
  AdminProductResponse,
  AdminProductVariantResponse,
  AdminProcessingJobResponse,
  AdminProcessingJobDetailResponse,
  AdminQueueHealthResponse,
  AdminRegionResponse,
  OfferDetailApiResponse,
  OptimizationResultApiResponse,
  PublicRegionApiResponse,
  PublicImpactResponse,
  ProductVariantResponse,
  RegionOffersApiResponse,
  CatalogProductSearchResponse,
};
