export interface PublicRegionContract {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  implantationStatus: 'active' | 'activating' | 'inactive';
  activeEstablishmentCount: number;
  offerCoverageStatus: 'live' | 'collecting_data';
  establishments: Array<{
    id: string;
    brandName: string;
    unitName: string;
    neighborhood: string;
    cityName: string;
    offerCount: number;
  }>;
}

export interface CityInclusionRequestContract {
  id: string;
  cityName: string;
  stateCode: string;
  status: 'requested' | 'reviewed' | 'planned' | 'rejected';
  createdAt: string;
}

export interface CreateCityInclusionRequestContract {
  cityName: string;
  stateCode: string;
  contactName?: string;
  contactEmail?: string;
  message?: string;
}

export interface PublicImpactContract {
  totalEstimatedSavings: number;
  optimizedListsCount: number;
}

export interface RegionalOffersContract {
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
    category: string;
    variantName?: string;
    imageUrl?: string | null;
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
  }>;
  groupedOffers?: Array<{
    id: string;
    catalogProductId: string;
    productVariantId: string;
    productName: string;
    category: string;
    variantName?: string;
    imageUrl?: string | null;
    packageLabel: string;
    bestOffer: RegionalOffersContract['offers'][number];
    alternativeOffers: RegionalOffersContract['offers'];
    offers: RegionalOffersContract['offers'];
    establishmentCount: number;
    cheapestPriceAmount: number;
    secondCheapestPriceAmount?: number;
    savingsVsSecondCheapest: number;
    averagePriceAmount: number;
    highestPriceAmount: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  filters: {
    stores: string[];
    categories: string[];
  };
}
