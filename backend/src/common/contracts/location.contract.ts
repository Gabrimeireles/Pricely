export interface UserLocationPreferenceContract {
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
}

export interface UpsertUserLocationPreferenceRequest {
  regionId: string;
  label: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  coverageRadiusKm?: number;
  isDefault?: boolean;
  locationSource?: 'manual' | 'browser_geolocation' | 'postal_code_fallback';
}

export interface CoveragePreviewRequest {
  regionId: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  coverageRadiusKm?: number;
}

export interface CoveragePreviewContract {
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
}
