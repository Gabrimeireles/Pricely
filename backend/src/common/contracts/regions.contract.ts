export interface PublicRegionContract {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  implantationStatus: 'active' | 'activating' | 'inactive';
  activeEstablishmentCount: number;
  offerCoverageStatus: 'live' | 'collecting_data';
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
    variantName?: string;
    imageUrl?: string | null;
    displayName: string;
    packageLabel: string;
    priceAmount: number;
    basePriceAmount?: number;
    promotionalPriceAmount?: number;
    savingsVsRegionalAverage?: number;
    observedAt: string;
    sourceLabel: string;
    storeName: string;
    neighborhood: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
}
