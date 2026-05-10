import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  type CoveragePreviewContract,
  type CoveragePreviewRequest,
  type UpsertUserLocationPreferenceRequest,
  type UserLocationPreferenceContract,
} from '../../common/contracts';
import { PrismaService } from '../../persistence/prisma.service';

const DEFAULT_COVERAGE_RADIUS_KM = 5;
const MIN_COVERAGE_RADIUS_KM = 1;
const MAX_COVERAGE_RADIUS_KM = 25;

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

    const preview = await this.previewCoverage(input);
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
          latitude: input.latitude,
          longitude: input.longitude,
          postalCode: input.postalCode,
          coverageRadiusKm:
            input.coverageRadiusKm ?? DEFAULT_COVERAGE_RADIUS_KM,
          activeEstablishmentCount: preview.activeEstablishmentCount,
          isDefault: shouldBeDefault,
          locationSource:
            input.locationSource ??
            (input.latitude !== undefined && input.longitude !== undefined
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
