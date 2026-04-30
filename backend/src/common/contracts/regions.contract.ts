export interface PublicRegionContract {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  implantationStatus: 'active' | 'activating' | 'inactive';
  activeEstablishmentCount: number;
  offerCoverageStatus: 'live' | 'collecting_data';
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
    observedAt: string;
    sourceLabel: string;
    storeName: string;
    neighborhood: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
}
