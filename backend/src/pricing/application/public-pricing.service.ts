import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../persistence/prisma.service';
import {
  PublicSearchMetricsService,
  type PublicSearchStrategy,
} from './public-search-metrics.service';

type PublicOfferSort =
  | 'name'
  | 'lowest-price'
  | 'highest-savings'
  | 'highest-confidence'
  | 'most-recent';

type PublicOfferQuery = {
  query?: string;
  store?: string;
  category?: string;
  confidence?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  latitude?: number;
  longitude?: number;
  coverageRadiusKm?: number;
};

@Injectable()
export class PublicPricingService {
  private static readonly searchCandidateLimit = 5_000;
  private readonly logger = new Logger(PublicPricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly searchMetrics?: PublicSearchMetricsService,
  ) {}

  async listRegionOffers(regionSlug: string, query: PublicOfferQuery = {}) {
    const region = await this.prisma.region.findUnique({
      where: {
        slug: regionSlug,
      },
    });

    if (!region || region.implantationStatus === 'inactive') {
      throw new NotFoundException(`Region ${regionSlug} was not found`);
    }

    const normalizedQuery = query.query?.trim();
    const normalizedStore = query.store?.trim();
    const normalizedCategory = query.category?.trim();
    const confidence =
      query.confidence === 'high' ||
      query.confidence === 'medium' ||
      query.confidence === 'low'
        ? query.confidence
        : undefined;
    const page = this.parsePositiveInteger(query.page, 1);
    const pageSize = Math.min(
      this.parsePositiveInteger(query.pageSize, 24),
      48,
    );
    const sort = this.parseOfferSort(query.sort);
    const searchStartedAt = normalizedQuery ? performance.now() : undefined;
    const textSearch = normalizedQuery
      ? await this.buildTextSearchWhere(normalizedQuery, region.id)
      : undefined;

    // Proximity filter: resolve establishments within coverageRadiusKm
    let nearbyEstablishmentIds: string[] | undefined;
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.coverageRadiusKm !== undefined
    ) {
      const allEstablishments = await this.prisma.establishment.findMany({
        where: { regionId: region.id, isActive: true },
        select: { id: true, latitude: true, longitude: true },
      });
      nearbyEstablishmentIds = allEstablishments
        .filter((e) => e.latitude !== null && e.longitude !== null)
        .filter(
          (e) =>
            this.distanceInKm(
              query.latitude!,
              query.longitude!,
              Number(e.latitude),
              Number(e.longitude),
            ) <= query.coverageRadiusKm!,
        )
        .map((e) => e.id);
      // If no establishments matched, use a sentinel so the query returns nothing
      if (nearbyEstablishmentIds.length === 0) {
        nearbyEstablishmentIds = ['__no_match__'];
      }
    }

    const offers = await this.prisma.productOffer.findMany({
      where: {
        isActive: true,
        availabilityStatus: 'available',
        ...(confidence ? { confidenceLevel: confidence } : {}),
        establishment: {
          isActive: true,
          regionId: region.id,
          ...(nearbyEstablishmentIds ? { id: { in: nearbyEstablishmentIds } } : {}),
          ...(normalizedStore
            ? {
                unitName: {
                  equals: normalizedStore,
                  mode: 'insensitive' as const,
                },
              }
            : {}),
        },
        catalogProduct: {
          isActive: true,
          ...(normalizedCategory
            ? {
                category: {
                  equals: normalizedCategory,
                  mode: 'insensitive' as const,
                },
              }
            : {}),
        },
        ...(textSearch?.where ?? {}),
      },
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: true,
      },
      orderBy: [{ observedAt: 'desc' }, { priceAmount: 'asc' }],
    });
    const comparisonByVariant = this.buildComparisonByVariant(offers);
    const projectedOffers = offers.map((offer) =>
      this.projectRegionalOffer(
        offer,
        comparisonByVariant.get(offer.productVariantId),
      ),
    );

    const groupedOffers = this.sortRegionalOfferGroups(
      this.groupRegionalOffers(projectedOffers),
      sort,
    );
    const totalItems = groupedOffers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginatedGroups = groupedOffers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
    const visibleOfferIds = new Set(
      paginatedGroups.flatMap((group) => group.offers.map((offer) => offer.id)),
    );
    const response = {
      region: {
        id: region.id,
        slug: region.slug,
        name: region.name,
        stateCode: region.stateCode,
      },
      activeEstablishmentCount: await this.prisma.establishment.count({
        where: {
          regionId: region.id,
          isActive: true,
        },
      }),
      offerCoverageStatus: offers.length > 0 ? 'live' : 'collecting_data',
      offers: projectedOffers.filter((offer) => visibleOfferIds.has(offer.id)),
      groupedOffers: paginatedGroups,
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
      filters: {
        stores: [
          ...new Set(
            projectedOffers.map((offer) => offer.storeName).filter(Boolean),
          ),
        ].sort((left, right) => left.localeCompare(right)),
        categories: [
          ...new Set(
            projectedOffers.map((offer) => offer.category).filter(Boolean),
          ),
        ].sort((left, right) => left.localeCompare(right)),
      },
    };

    this.logger.log(
      `Public offers requested for ${regionSlug}: ${response.offers.length} offers, ${response.activeEstablishmentCount} active establishments`,
    );

    if (
      response.activeEstablishmentCount === 0 ||
      response.offers.length === 0
    ) {
      this.logger.warn(
        `Public offers for ${regionSlug} returned sparse coverage: stores=${response.activeEstablishmentCount}, offers=${response.offers.length}`,
      );
    }

    if (searchStartedAt !== undefined && textSearch) {
      const durationMs = performance.now() - searchStartedAt;
      const searchLog = {
        event: 'public_offer_search',
        regionSlug,
        strategy: textSearch.strategy,
        durationMs: Math.round(durationMs * 100) / 100,
        resultCount: totalItems,
        candidateCounts: textSearch.candidateCounts,
      };

      this.logger.log(searchLog);
      if (this.searchMetrics) {
        void this.searchMetrics
          .record({
            durationMs,
            strategy: textSearch.strategy,
            resultCount: totalItems,
            regionSlug,
            candidateCounts: textSearch.candidateCounts,
          })
          .catch((error: unknown) => {
            this.logger.error({
              event: 'public_search_metric_persistence_failed',
              regionSlug,
              error: error instanceof Error ? error.message : String(error),
            });
          });
      }
    }

    return response;
  }

  private async buildTextSearchWhere(
    query: string,
    regionId: string,
  ): Promise<{
    where: Prisma.ProductOfferWhereInput;
    strategy: PublicSearchStrategy;
    candidateCounts: {
      offers: number;
      products: number;
      variants: number;
      establishments: number;
    };
  }> {
    const take = PublicPricingService.searchCandidateLimit + 1;
    const insensitiveContains = {
      contains: query,
      mode: 'insensitive' as const,
    };
    const [offers, products, variants, establishments] = await Promise.all([
      this.prisma.productOffer.findMany({
        where: {
          isActive: true,
          availabilityStatus: 'available',
          OR: [
            { displayName: insensitiveContains },
            { packageLabel: insensitiveContains },
          ],
          establishment: {
            isActive: true,
            regionId,
          },
        },
        select: { id: true },
        take,
      }),
      this.prisma.catalogProduct.findMany({
        where: {
          isActive: true,
          name: insensitiveContains,
        },
        select: { id: true },
        take,
      }),
      this.prisma.productVariant.findMany({
        where: {
          isActive: true,
          displayName: insensitiveContains,
        },
        select: { id: true },
        take,
      }),
      this.prisma.establishment.findMany({
        where: {
          isActive: true,
          regionId,
          OR: [
            { unitName: insensitiveContains },
            { neighborhood: insensitiveContains },
          ],
        },
        select: { id: true },
        take,
      }),
    ]);

    const candidateCounts = {
      offers: offers.length,
      products: products.length,
      variants: variants.length,
      establishments: establishments.length,
    };

    if (
      [offers, products, variants, establishments].some(
        (candidates) =>
          candidates.length > PublicPricingService.searchCandidateLimit,
      )
    ) {
      return {
        where: this.buildBroadTextSearchWhere(query),
        strategy: 'broad-fallback',
        candidateCounts,
      };
    }

    const candidates: Prisma.ProductOfferWhereInput[] = [];
    if (offers.length > 0) {
      candidates.push({ id: { in: offers.map(({ id }) => id) } });
    }
    if (products.length > 0) {
      candidates.push({
        catalogProductId: { in: products.map(({ id }) => id) },
      });
    }
    if (variants.length > 0) {
      candidates.push({
        productVariantId: { in: variants.map(({ id }) => id) },
      });
    }
    if (establishments.length > 0) {
      candidates.push({
        establishmentId: { in: establishments.map(({ id }) => id) },
      });
    }

    return {
      where: candidates.length > 0 ? { OR: candidates } : { id: { in: [] } },
      strategy: 'candidate',
      candidateCounts,
    };
  }

  private buildBroadTextSearchWhere(
    query: string,
  ): Prisma.ProductOfferWhereInput {
    const insensitiveContains = {
      contains: query,
      mode: 'insensitive' as const,
    };

    return {
      OR: [
        { displayName: insensitiveContains },
        { packageLabel: insensitiveContains },
        { catalogProduct: { name: insensitiveContains } },
        { productVariant: { displayName: insensitiveContains } },
        { establishment: { unitName: insensitiveContains } },
        { establishment: { neighborhood: insensitiveContains } },
      ],
    };
  }

  async getOfferDetail(offerId: string) {
    const offer = await this.prisma.productOffer.findUnique({
      where: {
        id: offerId,
      },
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: {
          include: {
            region: true,
          },
        },
      },
    });

    if (!offer || !offer.isActive || !offer.establishment.isActive) {
      throw new NotFoundException(`Offer ${offerId} was not found`);
    }

    const alternativeOffers = await this.prisma.productOffer.findMany({
      where: {
        productVariantId: offer.productVariantId,
        isActive: true,
        availabilityStatus: 'available',
        establishment: {
          isActive: true,
          regionId: offer.establishment.regionId,
        },
      },
      include: {
        establishment: true,
      },
      orderBy: [{ priceAmount: 'asc' }, { observedAt: 'desc' }],
    });
    const comparison = this.calculateComparison(alternativeOffers);

    const response = {
      id: offer.id,
      region: {
        id: offer.establishment.region.id,
        slug: offer.establishment.region.slug,
        name: offer.establishment.region.name,
        stateCode: offer.establishment.region.stateCode,
      },
      product: {
        id: offer.catalogProduct.id,
        name: offer.catalogProduct.name,
        category: offer.catalogProduct.category,
        imageUrl: offer.productVariant.imageUrl ?? undefined,
      },
      variant: {
        id: offer.productVariant.id,
        displayName: offer.productVariant.displayName,
        brandName: offer.productVariant.brandName,
        packageLabel: offer.productVariant.packageLabel,
      },
      activeOffer: {
        id: offer.id,
        displayName: offer.displayName,
        packageLabel: offer.packageLabel,
        priceAmount: Number(offer.priceAmount),
        basePriceAmount:
          offer.basePriceAmount !== null && offer.basePriceAmount !== undefined
            ? Number(offer.basePriceAmount)
            : Number(offer.priceAmount),
        promotionalPriceAmount:
          offer.promotionalPriceAmount !== null &&
          offer.promotionalPriceAmount !== undefined
            ? Number(offer.promotionalPriceAmount)
            : undefined,
        regionalAveragePriceAmount: comparison.averagePriceAmount,
        comparisonPriceAmount: comparison.secondCheapestPriceAmount,
        savingsVsComparison: Number(
          Math.max(
            0,
            comparison.secondCheapestPriceAmount - Number(offer.priceAmount),
          ).toFixed(2),
        ),
        observedAt: offer.observedAt.toISOString(),
        sourceLabel: offer.sourceReference ?? offer.sourceType,
        storeName: offer.establishment.unitName,
        neighborhood: offer.establishment.neighborhood,
        confidenceLevel: offer.confidenceLevel,
      },
      alternativeOffers: alternativeOffers.map((entry) => ({
        id: entry.id,
        storeName: entry.establishment.unitName,
        neighborhood: entry.establishment.neighborhood,
        packageLabel: entry.packageLabel,
        priceAmount: Number(entry.priceAmount),
        basePriceAmount:
          entry.basePriceAmount !== null && entry.basePriceAmount !== undefined
            ? Number(entry.basePriceAmount)
            : Number(entry.priceAmount),
        promotionalPriceAmount:
          entry.promotionalPriceAmount !== null &&
          entry.promotionalPriceAmount !== undefined
            ? Number(entry.promotionalPriceAmount)
            : undefined,
        observedAt: entry.observedAt.toISOString(),
        sourceLabel: entry.sourceReference ?? entry.sourceType,
        confidenceLevel: entry.confidenceLevel,
      })),
    };

    this.logger.log(
      `Offer detail requested for ${offerId}: ${response.alternativeOffers.length} regional alternatives`,
    );

    return response;
  }

  private buildComparisonByVariant(
    offers: Array<{
      productVariantId: string;
      priceAmount: { toString(): string } | number;
    }>,
  ) {
    const grouped = new Map<
      string,
      Array<{ priceAmount: { toString(): string } | number }>
    >();

    for (const offer of offers) {
      const existing = grouped.get(offer.productVariantId) ?? [];
      existing.push(offer);
      grouped.set(offer.productVariantId, existing);
    }

    return new Map(
      [...grouped.entries()].map(([variantId, entries]) => [
        variantId,
        this.calculateComparison(entries),
      ]),
    );
  }

  private parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseOfferSort(value: string | undefined): PublicOfferSort {
    if (
      value === 'lowest-price' ||
      value === 'highest-savings' ||
      value === 'highest-confidence' ||
      value === 'most-recent'
    ) {
      return value;
    }

    return 'name';
  }

  private calculateComparison(
    offers: Array<{ priceAmount: { toString(): string } | number }>,
  ) {
    const prices = offers.map((offer) => Number(offer.priceAmount));
    const sortedPrices = [...prices].sort((left, right) => left - right);
    const highestPriceAmount = prices.length > 0 ? Math.max(...prices) : 0;
    const secondCheapestPriceAmount = sortedPrices[1] ?? sortedPrices[0] ?? 0;
    const averagePriceAmount =
      prices.length > 0
        ? Number(
            (
              prices.reduce((sum, price) => sum + price, 0) / prices.length
            ).toFixed(2),
          )
        : 0;

    return {
      highestPriceAmount,
      secondCheapestPriceAmount,
      averagePriceAmount,
    };
  }

  private projectRegionalOffer(
    offer: {
      id: string;
      catalogProductId: string;
      productVariantId: string;
      displayName: string;
      packageLabel: string;
      priceAmount: { toString(): string } | number;
      basePriceAmount?: { toString(): string } | number | null;
      promotionalPriceAmount?: { toString(): string } | number | null;
      observedAt: Date;
      sourceReference: string | null;
      sourceType: string;
      confidenceLevel: 'high' | 'medium' | 'low';
      catalogProduct: {
        name: string;
        category: string;
        imageUrl: string | null;
      };
      productVariant: {
        displayName: string;
        imageUrl: string | null;
      };
      establishment: {
        unitName: string;
        neighborhood: string;
      };
    },
    comparison?: {
      averagePriceAmount: number;
      highestPriceAmount: number;
      secondCheapestPriceAmount: number;
    },
  ) {
    const priceAmount = Number(offer.priceAmount);
    const average = comparison?.averagePriceAmount ?? priceAmount;
    const comparisonPriceAmount =
      comparison?.secondCheapestPriceAmount ?? priceAmount;

    return {
      id: offer.id,
      catalogProductId: offer.catalogProductId,
      productVariantId: offer.productVariantId,
      productName: offer.catalogProduct.name,
      category: offer.catalogProduct.category,
      variantName: offer.productVariant.displayName,
      imageUrl: offer.productVariant.imageUrl ?? undefined,
      displayName: offer.displayName,
      packageLabel: offer.packageLabel,
      priceAmount,
      basePriceAmount:
        offer.basePriceAmount !== null && offer.basePriceAmount !== undefined
          ? Number(offer.basePriceAmount)
          : priceAmount,
      promotionalPriceAmount:
        offer.promotionalPriceAmount !== null &&
        offer.promotionalPriceAmount !== undefined
          ? Number(offer.promotionalPriceAmount)
          : undefined,
      savingsVsRegionalAverage: Number(
        Math.max(0, average - priceAmount).toFixed(2),
      ),
      regionalAveragePriceAmount: average,
      comparisonPriceAmount,
      savingsVsComparison: Number(
        Math.max(0, comparisonPriceAmount - priceAmount).toFixed(2),
      ),
      observedAt: offer.observedAt.toISOString(),
      sourceLabel: offer.sourceReference ?? offer.sourceType,
      storeName: offer.establishment.unitName,
      neighborhood: offer.establishment.neighborhood,
      confidenceLevel: offer.confidenceLevel,
    };
  }

  private groupRegionalOffers(
    offers: Array<ReturnType<PublicPricingService['projectRegionalOffer']>>,
  ) {
    const grouped = new Map<
      string,
      Array<ReturnType<PublicPricingService['projectRegionalOffer']>>
    >();

    for (const offer of offers) {
      const key = offer.productVariantId;
      grouped.set(key, [...(grouped.get(key) ?? []), offer]);
    }

    return [...grouped.values()]
      .map((entries) => {
        const sorted = [...entries].sort((left, right) => {
          if (left.priceAmount !== right.priceAmount) {
            return left.priceAmount - right.priceAmount;
          }

          return (
            new Date(right.observedAt).getTime() -
            new Date(left.observedAt).getTime()
          );
        });
        const bestOffer = sorted[0];
        const prices = sorted.map((entry) => entry.priceAmount);
        const secondCheapestPriceAmount = sorted[1]?.priceAmount;
        const averagePriceAmount = Number(
          (
            prices.reduce((sum, price) => sum + price, 0) / prices.length
          ).toFixed(2),
        );

        return {
          id: bestOffer.productVariantId,
          catalogProductId: bestOffer.catalogProductId,
          productVariantId: bestOffer.productVariantId,
          productName: bestOffer.productName,
          category: bestOffer.category,
          variantName: bestOffer.variantName,
          imageUrl: bestOffer.imageUrl,
          packageLabel: bestOffer.packageLabel,
          bestOffer,
          alternativeOffers: sorted.slice(1),
          offers: sorted,
          establishmentCount: sorted.length,
          cheapestPriceAmount: bestOffer.priceAmount,
          secondCheapestPriceAmount,
          savingsVsSecondCheapest: Number(
            Math.max(
              0,
              (secondCheapestPriceAmount ?? bestOffer.priceAmount) -
                bestOffer.priceAmount,
            ).toFixed(2),
          ),
          averagePriceAmount,
          highestPriceAmount: Math.max(...prices),
        };
      })
      .sort((left, right) => {
        if (left.productName !== right.productName) {
          return left.productName.localeCompare(right.productName);
        }

        return left.cheapestPriceAmount - right.cheapestPriceAmount;
      });
  }

  private sortRegionalOfferGroups(
    groups: ReturnType<PublicPricingService['groupRegionalOffers']>,
    sort: PublicOfferSort,
  ) {
    return [...groups].sort((left, right) => {
      if (sort === 'lowest-price') {
        return left.cheapestPriceAmount - right.cheapestPriceAmount;
      }

      if (sort === 'highest-savings') {
        const leftSavings = Math.max(
          left.savingsVsSecondCheapest,
          left.bestOffer.savingsVsRegionalAverage,
          left.bestOffer.savingsVsComparison,
        );
        const rightSavings = Math.max(
          right.savingsVsSecondCheapest,
          right.bestOffer.savingsVsRegionalAverage,
          right.bestOffer.savingsVsComparison,
        );
        return rightSavings - leftSavings;
      }

      if (sort === 'highest-confidence') {
        const confidenceRank = { high: 3, medium: 2, low: 1 };
        return (
          confidenceRank[right.bestOffer.confidenceLevel] -
          confidenceRank[left.bestOffer.confidenceLevel]
        );
      }

      if (sort === 'most-recent') {
        return (
          new Date(right.bestOffer.observedAt).getTime() -
          new Date(left.bestOffer.observedAt).getTime()
        );
      }

      return (left.variantName ?? left.productName).localeCompare(
        right.variantName ?? right.productName,
        'pt-BR',
      );
    });
  }

  private distanceInKm(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ) {
    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(destLat - originLat);
    const dLng = toRad(destLng - originLng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
}
