import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  type CoveragePreviewContract,
  type CoveragePreviewRequest,
  type NearestRegionContract,
  type UpsertUserLocationPreferenceRequest,
  type UserLocationPreferenceContract,
} from '../../common/contracts';
import { PrismaService } from '../../persistence/prisma.service';

const DEFAULT_COVERAGE_RADIUS_KM = 5;
const MIN_COVERAGE_RADIUS_KM = 1;
const MAX_COVERAGE_RADIUS_KM = 30;
const NOMINATIM_UA = 'Pricely/1.0 (pricely.grmeireles.dev)';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  defaultCoverageRadiusKm() {
    return DEFAULT_COVERAGE_RADIUS_KM;
  }

  async listPreferences(
    userId: string,
  ): Promise<UserLocationPreferenceContract[]> {
    const preferences = await this.prisma.userLocationPreference.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: {
        region: true,
      },
    });

    return preferences.map((preference) => this.toContract(preference));
  }

  async upsertPreference(
    userId: string,
    input: UpsertUserLocationPreferenceRequest,
  ): Promise<UserLocationPreferenceContract> {
    this.assertLocationInput(input);

    const region = await this.prisma.region.findUnique({
      where: { id: input.regionId },
    });
    if (!region) {
      throw new NotFoundException(`Region ${input.regionId} was not found`);
    }

    // Enrich: GPS coords → CEP via reverse geocoding
    let enrichedPostalCode = input.postalCode;
    let enrichedLatitude = input.latitude;
    let enrichedLongitude = input.longitude;

    if (input.latitude !== undefined && input.longitude !== undefined && !input.postalCode) {
      const cep = await this.reverseGeocodeCoordinates(input.latitude, input.longitude).catch(() => null);
      if (cep) enrichedPostalCode = cep;
    }

    // Enrich: CEP → GPS coords via forward geocoding
    if (input.postalCode && input.latitude === undefined) {
      const coords = await this.geocodePostalCode(input.postalCode).catch(() => null);
      if (coords) {
        enrichedLatitude = coords.lat;
        enrichedLongitude = coords.lng;
      }
    }

    const enrichedInput = { ...input, latitude: enrichedLatitude, longitude: enrichedLongitude, postalCode: enrichedPostalCode };
    const preview = await this.previewCoverage(enrichedInput);
    const shouldBeDefault = input.isDefault ?? true;

    const created = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.userLocationPreference.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.userLocationPreference.create({
        data: {
          userId,
          regionId: input.regionId,
          label: input.label.trim(),
          latitude: enrichedLatitude,
          longitude: enrichedLongitude,
          postalCode: enrichedPostalCode,
          coverageRadiusKm:
            input.coverageRadiusKm ?? DEFAULT_COVERAGE_RADIUS_KM,
          activeEstablishmentCount: preview.activeEstablishmentCount,
          isDefault: shouldBeDefault,
          locationSource:
            input.locationSource ??
            (enrichedLatitude !== undefined && enrichedLongitude !== undefined
              ? 'manual'
              : 'postal_code_fallback'),
        },
        include: {
          region: true,
        },
      });
    });

    return this.toContract(created);
  }

  async nearestRegionForCoordinates(lat: number, lng: number): Promise<NearestRegionContract | null> {
    return this.findNearestRegion(lat, lng);
  }

  async previewCoverage(
    input: CoveragePreviewRequest,
  ): Promise<CoveragePreviewContract> {
    const radius = this.normalizeRadius(input.coverageRadiusKm);
    const establishments = await this.prisma.establishment.findMany({
      where: {
        regionId: input.regionId,
        isActive: true,
      },
      orderBy: [{ brandName: 'asc' }, { unitName: 'asc' }],
    });

    const hasCoordinates =
      input.latitude !== undefined && input.longitude !== undefined;

    if (!hasCoordinates) {
      const fallbackEstablishments = establishments.slice(0, 12).map((store) => ({
        id: store.id,
        brandName: store.brandName,
        unitName: store.unitName,
        neighborhood: store.neighborhood,
        postalCode: store.postalCode,
        distanceKm: null,
        latitude: store.latitude === null ? null : Number(store.latitude),
        longitude: store.longitude === null ? null : Number(store.longitude),
      }));

      return {
        regionId: input.regionId,
        coverageRadiusKm: radius,
        activeEstablishmentCount: establishments.length,
        fallbackUsed: true,
        fallbackReason: input.postalCode
          ? 'postal_code_only'
          : 'missing_coordinates',
        establishments: fallbackEstablishments,
      };
    }

    const originLatitude = input.latitude as number;
    const originLongitude = input.longitude as number;

    const covered = establishments
      .map((store) => {
        const distanceKm =
          store.latitude !== null && store.longitude !== null
            ? this.distanceInKm(
                originLatitude,
                originLongitude,
                Number(store.latitude),
                Number(store.longitude),
              )
            : null;

        return {
          id: store.id,
          brandName: store.brandName,
          unitName: store.unitName,
          neighborhood: store.neighborhood,
          postalCode: store.postalCode,
          distanceKm,
          latitude: store.latitude === null ? null : Number(store.latitude),
          longitude: store.longitude === null ? null : Number(store.longitude),
        };
      })
      .filter(
        (store): store is typeof store & { distanceKm: number } =>
          store.distanceKm !== null && store.distanceKm <= radius,
      )
      .sort((left, right) => left.distanceKm - right.distanceKm);

    return {
      regionId: input.regionId,
      coverageRadiusKm: radius,
      activeEstablishmentCount: covered.length,
      fallbackUsed: false,
      establishments: covered.slice(0, 12),
    };
  }

  private async geocodePostalCode(postalCode: string): Promise<{ lat: number; lng: number } | null> {
    const cep = postalCode.replace(/\D/g, '');
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep}&countrycodes=BR&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': NOMINATIM_UA } });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  }

  private async reverseGeocodeCoordinates(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': NOMINATIM_UA } });
    if (!res.ok) return null;
    const data = await res.json() as { address?: { postcode?: string } };
    const raw = data.address?.postcode;
    if (!raw) return null;
    return raw.replace(/\D/g, '');
  }

  private async findNearestRegion(lat: number, lng: number): Promise<NearestRegionContract | null> {
    const establishments = await this.prisma.establishment.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        latitude: true,
        longitude: true,
        region: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!establishments.length) return null;

    let nearest: (typeof establishments)[0] | null = null;
    let minDist = Infinity;

    for (const e of establishments) {
      const d = this.distanceInKm(lat, lng, Number(e.latitude), Number(e.longitude));
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }

    return nearest?.region ?? null;
  }

  private assertLocationInput(input: UpsertUserLocationPreferenceRequest) {
    if (!input.label.trim()) {
      throw new BadRequestException('Location label is required');
    }

    const hasLatitude = input.latitude !== undefined;
    const hasLongitude = input.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'Latitude and longitude must be provided together',
      );
    }

    if (!hasLatitude && !input.postalCode) {
      throw new BadRequestException(
        'Provide coordinates or a postal code fallback',
      );
    }

    this.normalizeRadius(input.coverageRadiusKm);
  }

  private normalizeRadius(radius?: number) {
    const normalized = radius ?? DEFAULT_COVERAGE_RADIUS_KM;
    if (
      !Number.isFinite(normalized) ||
      normalized < MIN_COVERAGE_RADIUS_KM ||
      normalized > MAX_COVERAGE_RADIUS_KM
    ) {
      throw new BadRequestException(
        `Coverage radius must be between ${MIN_COVERAGE_RADIUS_KM} and ${MAX_COVERAGE_RADIUS_KM} km`,
      );
    }

    return normalized;
  }

  private distanceInKm(
    originLatitude: number,
    originLongitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
  ) {
    const earthRadiusKm = 6371;
    const latDelta = this.toRadians(destinationLatitude - originLatitude);
    const lonDelta = this.toRadians(destinationLongitude - originLongitude);
    const originLat = this.toRadians(originLatitude);
    const destinationLat = this.toRadians(destinationLatitude);
    const haversine =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(originLat) *
        Math.cos(destinationLat) *
        Math.sin(lonDelta / 2) *
        Math.sin(lonDelta / 2);

    return (
      earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  private toContract(preference: {
    id: string;
    regionId: string;
    label: string;
    latitude: unknown;
    longitude: unknown;
    postalCode: string | null;
    coverageRadiusKm: unknown;
    activeEstablishmentCount: number;
    isDefault: boolean;
    locationSource: string;
    createdAt: Date;
    updatedAt: Date;
    region: {
      slug: string;
      name: string;
    };
  }): UserLocationPreferenceContract {
    return {
      id: preference.id,
      regionId: preference.regionId,
      regionSlug: preference.region.slug,
      regionName: preference.region.name,
      label: preference.label,
      latitude:
        preference.latitude === null ? null : Number(preference.latitude),
      longitude:
        preference.longitude === null ? null : Number(preference.longitude),
      postalCode: preference.postalCode,
      coverageRadiusKm: Number(preference.coverageRadiusKm),
      activeEstablishmentCount: preference.activeEstablishmentCount,
      isDefault: preference.isDefault,
      locationSource:
        preference.locationSource as UserLocationPreferenceContract['locationSource'],
      createdAt: preference.createdAt.toISOString(),
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
