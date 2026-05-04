import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class PublicPricingService {
  private readonly logger = new Logger(PublicPricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listRegionOffers(regionSlug: string) {
    const region = await this.prisma.region.findUnique({
      where: {
        slug: regionSlug,
      },
    });

    if (!region || region.implantationStatus === 'inactive') {
      throw new NotFoundException(`Region ${regionSlug} was not found`);
    }

    const offers = await this.prisma.productOffer.findMany({
      where: {
        isActive: true,
        availabilityStatus: 'available',
        establishment: {
          isActive: true,
          regionId: region.id,
        },
        catalogProduct: {
          isActive: true,
        },
      },
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: true,
      },
      orderBy: [{ observedAt: 'desc' }, { priceAmount: 'asc' }],
    });
    const comparisonByVariant = this.buildComparisonByVariant(offers);

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
      offers: offers.map((offer) =>
        this.projectRegionalOffer(
          offer,
          comparisonByVariant.get(offer.productVariantId),
        ),
      ),
    };

    this.logger.log(
      `Public offers requested for ${regionSlug}: ${response.offers.length} offers, ${response.activeEstablishmentCount} active establishments`,
    );

    if (response.activeEstablishmentCount === 0 || response.offers.length === 0) {
      this.logger.warn(
        `Public offers for ${regionSlug} returned sparse coverage: stores=${response.activeEstablishmentCount}, offers=${response.offers.length}`,
      );
    }

    return response;
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
        imageUrl: offer.productVariant.imageUrl ?? offer.catalogProduct.imageUrl,
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
          offer.promotionalPriceAmount !== null && offer.promotionalPriceAmount !== undefined
            ? Number(offer.promotionalPriceAmount)
            : undefined,
        regionalAveragePriceAmount: comparison.averagePriceAmount,
        comparisonPriceAmount: comparison.highestPriceAmount,
        savingsVsComparison: Number(
          Math.max(0, comparison.highestPriceAmount - Number(offer.priceAmount)).toFixed(2),
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
          entry.promotionalPriceAmount !== null && entry.promotionalPriceAmount !== undefined
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
    const grouped = new Map<string, Array<{ priceAmount: { toString(): string } | number }>>();

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

  private calculateComparison(
    offers: Array<{ priceAmount: { toString(): string } | number }>,
  ) {
    const prices = offers.map((offer) => Number(offer.priceAmount));
    const highestPriceAmount = prices.length > 0 ? Math.max(...prices) : 0;
    const averagePriceAmount =
      prices.length > 0
        ? Number((prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2))
        : 0;

    return {
      highestPriceAmount,
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
    comparison?: { averagePriceAmount: number; highestPriceAmount: number },
  ) {
    const priceAmount = Number(offer.priceAmount);
    const average = comparison?.averagePriceAmount ?? priceAmount;

    return {
      id: offer.id,
      catalogProductId: offer.catalogProductId,
      productVariantId: offer.productVariantId,
      productName: offer.catalogProduct.name,
      variantName: offer.productVariant.displayName,
      imageUrl: offer.productVariant.imageUrl ?? offer.catalogProduct.imageUrl,
      displayName: offer.displayName,
      packageLabel: offer.packageLabel,
      priceAmount,
      basePriceAmount:
        offer.basePriceAmount !== null && offer.basePriceAmount !== undefined
          ? Number(offer.basePriceAmount)
          : priceAmount,
      promotionalPriceAmount:
        offer.promotionalPriceAmount !== null && offer.promotionalPriceAmount !== undefined
          ? Number(offer.promotionalPriceAmount)
          : undefined,
      savingsVsRegionalAverage: Number(Math.max(0, average - priceAmount).toFixed(2)),
      observedAt: offer.observedAt.toISOString(),
      sourceLabel: offer.sourceReference ?? offer.sourceType,
      storeName: offer.establishment.unitName,
      neighborhood: offer.establishment.neighborhood,
      confidenceLevel: offer.confidenceLevel,
    };
  }
}
