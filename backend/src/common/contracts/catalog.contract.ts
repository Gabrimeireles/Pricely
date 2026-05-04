export interface CatalogProductVariantSummary {
  id: string;
  catalogProductId: string;
  slug: string;
  displayName: string;
  brandName?: string | null;
  variantLabel?: string | null;
  packageLabel?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CatalogProductSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  defaultUnit?: string | null;
  imageUrl?: string | null;
  productVariants: CatalogProductVariantSummary[];
}

export interface CatalogProductDetailContract {
  catalogProduct: {
    id: string;
    slug: string;
    name: string;
    category: string;
    defaultUnit?: string | null;
    imageUrl?: string | null;
    isActive: boolean;
  };
  variants: CatalogProductVariantSummary[];
  offers: Array<{
    id: string;
    catalogProductId: string;
    productVariantId: string;
    displayName: string;
    packageLabel: string;
    priceAmount: number;
    basePriceAmount?: number;
    promotionalPriceAmount?: number;
    observedAt: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    storeName: string;
    neighborhood: string;
    region: {
      id: string;
      slug: string;
      name: string;
      stateCode: string;
    };
  }>;
}
