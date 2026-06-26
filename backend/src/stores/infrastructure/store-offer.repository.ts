import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../persistence/prisma.service';
import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';
import { type StoreOfferEntity } from '../domain/store-offer.entity';

type ProductOfferWithRelations = Prisma.ProductOfferGetPayload<{
  include: {
    catalogProduct: true;
    productVariant: true;
    establishment: true;
    receiptRecord: true;
  };
}>;

interface OfferTrustProfile {
  factor: number;
  level: 'high' | 'medium' | 'low';
  evidenceCount: number;
  freshnessDays: number;
  lastValidatedAt: string;
  explanation: string;
}

@Injectable()
export class StoreOfferRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productNormalizerService: ProductNormalizerService,
  ) {}

  async upsert(offer: StoreOfferEntity): Promise<StoreOfferEntity> {
    const establishment = await this.resolveEstablishment(offer);
    const catalogProduct = await this.resolveCatalogProduct(offer);
    const productVariant = await this.resolveProductVariant(offer, catalogProduct.id);

    await this.prisma.productOffer.upsert({
      where: {
        id: offer.id,
      },
      update: {
        catalogProductId: catalogProduct.id,
        productVariantId: productVariant.id,
        establishmentId: establishment.id,
        displayName: offer.displayName,
        packageLabel: offer.quantityContext ?? 'un',
        priceAmount: offer.price,
        basePriceAmount: offer.basePrice ?? offer.price,
        promotionalPriceAmount: offer.promotionalPrice ?? null,
        availabilityStatus:
          offer.availabilityStatus === 'available'
            ? 'available'
            : offer.availabilityStatus === 'unavailable'
              ? 'unavailable'
              : 'uncertain',
        confidenceLevel:
          offer.confidenceScore >= 0.85
            ? 'high'
            : offer.confidenceScore >= 0.6
              ? 'medium'
              : 'low',
        sourceType: 'receipt',
        sourceReference: offer.sourceReceiptLineItemId,
        observedAt: new Date(offer.observedAt),
        isActive: true,
      },
      create: {
        id: offer.id,
        catalogProductId: catalogProduct.id,
        productVariantId: productVariant.id,
        establishmentId: establishment.id,
        displayName: offer.displayName,
        packageLabel: offer.quantityContext ?? 'un',
        priceAmount: offer.price,
        basePriceAmount: offer.basePrice ?? offer.price,
        promotionalPriceAmount: offer.promotionalPrice ?? null,
        currencyCode: 'BRL',
        availabilityStatus:
          offer.availabilityStatus === 'available'
            ? 'available'
            : offer.availabilityStatus === 'unavailable'
              ? 'unavailable'
              : 'uncertain',
        confidenceLevel:
          offer.confidenceScore >= 0.85
            ? 'high'
            : offer.confidenceScore >= 0.6
              ? 'medium'
              : 'low',
        sourceType: 'receipt',
        sourceReference: offer.sourceReceiptLineItemId,
        observedAt: new Date(offer.observedAt),
        isActive: true,
      },
    });

    return offer;
  }

  async findByCanonicalNames(canonicalNames: string[]): Promise<StoreOfferEntity[]> {
    if (canonicalNames.length === 0) {
      return [];
    }

    const activeOffers = await this.prisma.productOffer.findMany({
      where: {
        isActive: true,
        availabilityStatus: 'available',
        catalogProduct: {
          isActive: true,
        },
        establishment: {
          isActive: true,
          region: {
            implantationStatus: {
              not: 'inactive',
            },
          },
        },
      },
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: true,
        receiptRecord: true,
      },
    });
    const trustProfiles = this.buildTrustProfiles(activeOffers);

    return activeOffers
      .map((offer) => {
        return this.toStoreOfferEntity(offer, trustProfiles);
      })
      .filter((offer) =>
        (offer.matchingCanonicalNames ?? [offer.canonicalName]).some((name) =>
          canonicalNames.includes(name),
        ),
      );
  }

  async findByListItems(
    items: Array<{ catalogProductId?: string; normalizedName?: string }>,
    scope?: {
      regionId?: string;
      establishmentIds?: string[];
    },
  ): Promise<StoreOfferEntity[]> {
    const catalogProductIds = new Set(items.map((item) => item.catalogProductId).filter(Boolean));
    const canonicalNames = new Set(items.map((item) => item.normalizedName).filter(Boolean));

    if (catalogProductIds.size === 0 && canonicalNames.size === 0) {
      return [];
    }
    if (scope?.establishmentIds && scope.establishmentIds.length === 0) {
      return [];
    }

    const activeOffers = await this.prisma.productOffer.findMany({
      where: {
        isActive: true,
        availabilityStatus: 'available',
        OR: [
          catalogProductIds.size > 0
            ? { catalogProductId: { in: [...catalogProductIds] as string[] } }
            : undefined,
          canonicalNames.size > 0
            ? {
                catalogProduct: {
                  isActive: true,
                },
              }
            : undefined,
        ].filter(Boolean) as Prisma.ProductOfferWhereInput[],
        establishment: {
          isActive: true,
          regionId: scope?.regionId,
          id:
            scope?.establishmentIds && scope.establishmentIds.length > 0
              ? { in: scope.establishmentIds }
              : undefined,
          region: {
            implantationStatus: {
              not: 'inactive',
            },
          },
        },
      },
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: true,
        receiptRecord: true,
      },
    });
    const trustProfiles = this.buildTrustProfiles(activeOffers);

    return activeOffers
      .map((offer) => {
        return this.toStoreOfferEntity(offer, trustProfiles);
      })
      .filter(
        (offer) =>
          (offer.catalogProductId && catalogProductIds.has(offer.catalogProductId)) ||
          (offer.matchingCanonicalNames ?? [offer.canonicalName]).some((name) =>
            canonicalNames.has(name),
          ),
      );
  }

  private toStoreOfferEntity(
    offer: ProductOfferWithRelations,
    trustProfiles: Map<string, OfferTrustProfile>,
  ): StoreOfferEntity {
    const normalizedProductName = this.productNormalizerService.normalize(
      offer.catalogProduct.name,
    ).canonicalName;
    const matchingCanonicalNames = this.buildMatchingCanonicalNames({
      catalogProductName: offer.catalogProduct.name,
      variantName: offer.productVariant.displayName,
      brandName: offer.productVariant.brandName,
      displayName: offer.displayName,
    });
    const trustProfile = trustProfiles.get(this.buildTrustProfileKey(offer));

    return {
      id: offer.id,
      catalogProductId: offer.catalogProductId,
      productVariantId: offer.productVariantId,
      brandName: offer.productVariant.brandName ?? undefined,
      variantName: offer.productVariant.displayName,
      storeId: offer.establishmentId,
      storeName: offer.establishment.unitName,
      storeRegionId: offer.establishment.regionId,
      storeLatitude:
        offer.establishment.latitude !== null
          ? Number(offer.establishment.latitude)
          : undefined,
      storeLongitude:
        offer.establishment.longitude !== null
          ? Number(offer.establishment.longitude)
          : undefined,
      canonicalName: normalizedProductName,
      matchingCanonicalNames,
      displayName: offer.displayName,
      price: Number(offer.priceAmount),
      basePrice:
        offer.basePriceAmount !== null
          ? Number(offer.basePriceAmount)
          : Number(offer.priceAmount),
      promotionalPrice:
        offer.promotionalPriceAmount !== null
          ? Number(offer.promotionalPriceAmount)
          : undefined,
      quantityContext: offer.packageLabel,
      availabilityStatus:
        offer.availabilityStatus === 'available'
          ? 'available'
          : offer.availabilityStatus === 'unavailable'
            ? 'unavailable'
            : 'uncertain',
      confidenceScore: this.confidenceScoreForLevel(offer.confidenceLevel),
      trustFactor: trustProfile?.factor,
      trustLevel: trustProfile?.level,
      trustEvidenceCount: trustProfile?.evidenceCount,
      trustFreshnessDays: trustProfile?.freshnessDays,
      trustLastValidatedAt: trustProfile?.lastValidatedAt,
      trustExplanation: trustProfile?.explanation,
      sourceReceiptLineItemId: offer.sourceReference ?? offer.sourceType,
      observedAt: offer.observedAt.toISOString(),
    };
  }

  private buildTrustProfiles(
    offers: ProductOfferWithRelations[],
  ): Map<string, OfferTrustProfile> {
    const now = new Date();
    const profiles = new Map<
      string,
      { offers: ProductOfferWithRelations[]; trustedReceiptIds: Set<string> }
    >();

    for (const offer of offers) {
      const key = this.buildTrustProfileKey(offer);
      const profile = profiles.get(key) ?? {
        offers: [],
        trustedReceiptIds: new Set<string>(),
      };

      profile.offers.push(offer);
      if (this.isTrustedReceiptEvidence(offer)) {
        profile.trustedReceiptIds.add(offer.receiptRecordId as string);
      }
      profiles.set(key, profile);
    }

    return new Map(
      [...profiles.entries()].map(([key, profile]) => {
        const latestOffer = profile.offers.reduce((latest, offer) =>
          offer.observedAt > latest.observedAt ? offer : latest,
        );
        const evidenceCount = profile.trustedReceiptIds.size;
        const freshnessDays = Math.max(
          0,
          Math.floor(
            (now.getTime() - latestOffer.observedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        const baseConfidence = this.confidenceScoreForLevel(
          latestOffer.confidenceLevel,
        );
        const evidenceScore = Math.min(1, evidenceCount / 5);
        const freshnessScore = this.freshnessScore(freshnessDays);
        const adminFallback =
          evidenceCount === 0 && latestOffer.sourceType !== 'receipt' ? 0.2 : 0;
        const factor = Math.round(
          100 *
            Math.min(
              1,
              baseConfidence * 0.4 +
                evidenceScore * 0.35 +
                freshnessScore * 0.25 +
                adminFallback,
            ),
        );
        const level =
          factor >= 75 ? 'high' : factor >= 50 ? 'medium' : 'low';

        return [
          key,
          {
            factor,
            level,
            evidenceCount,
            freshnessDays,
            lastValidatedAt: latestOffer.observedAt.toISOString(),
            explanation: this.buildTrustExplanation(
              evidenceCount,
              freshnessDays,
              factor,
              latestOffer.sourceType,
            ),
          },
        ];
      }),
    );
  }

  private buildTrustProfileKey(offer: {
    productVariantId: string;
    establishmentId: string;
  }): string {
    return `${offer.productVariantId}:${offer.establishmentId}`;
  }

  private isTrustedReceiptEvidence(offer: ProductOfferWithRelations): boolean {
    return Boolean(
      offer.receiptRecordId &&
        offer.receiptRecord &&
        offer.receiptRecord.trustLevel === 'trusted' &&
        offer.receiptRecord.moderationStatus === 'accepted',
    );
  }

  private confidenceScoreForLevel(level: 'high' | 'medium' | 'low'): number {
    if (level === 'high') {
      return 0.95;
    }
    if (level === 'medium') {
      return 0.7;
    }
    return 0.45;
  }

  private freshnessScore(freshnessDays: number): number {
    if (freshnessDays <= 14) {
      return 1;
    }
    if (freshnessDays >= 90) {
      return 0.25;
    }

    return Number((1 - ((freshnessDays - 14) / 76) * 0.75).toFixed(2));
  }

  private buildTrustExplanation(
    evidenceCount: number,
    freshnessDays: number,
    factor: number,
    sourceType: string,
  ): string {
    const sourceLabel = this.trustSourceLabel(sourceType);
    const receiptText =
      evidenceCount === 0
        ? `preco ainda sem nota fiscal aceita; origem ${sourceLabel} sustenta a oferta`
        : evidenceCount === 1
        ? '1 nota fiscal aceita apoia este preco'
        : `${evidenceCount} notas fiscais aceitas apoiam este preco`;
    const freshnessText =
      freshnessDays === 0
        ? 'validacao hoje'
        : `ultima validacao ha ${freshnessDays} dias`;

    return `${receiptText}; ${freshnessText}; confianca da oferta ${factor}/100.`;
  }

  private trustSourceLabel(sourceType: string): string {
    if (sourceType === 'receipt') {
      return 'nota fiscal';
    }
    if (sourceType === 'admin' || sourceType === 'manual') {
      return 'cadastro administrativo';
    }
    if (sourceType === 'flyer') {
      return 'encarte';
    }
    if (sourceType === 'site') {
      return 'site do estabelecimento';
    }

    return 'operacional';
  }

  private buildMatchingCanonicalNames(input: {
    catalogProductName: string;
    variantName?: string | null;
    brandName?: string | null;
    displayName: string;
  }): string[] {
    const candidates = [
      input.catalogProductName,
      input.variantName,
      input.displayName,
      input.brandName && input.variantName
        ? `${input.brandName} ${input.variantName}`
        : undefined,
      input.brandName && input.displayName
        ? `${input.brandName} ${input.displayName}`
        : undefined,
    ];

    return [
      ...new Set(
        candidates
          .filter((candidate): candidate is string => Boolean(candidate))
          .map((candidate) => this.productNormalizerService.normalize(candidate).canonicalName)
          .filter(Boolean),
      ),
    ];
  }

  private async resolveEstablishment(offer: StoreOfferEntity) {
    const existing = await this.prisma.establishment.findFirst({
      where: {
        unitName: offer.storeName,
      },
    });

    if (existing) {
      return existing;
    }

    const region = await this.prisma.region.findFirst({
      where: {
        implantationStatus: {
          not: 'inactive',
        },
      },
      orderBy: {
        publicSortOrder: 'asc',
      },
    });

    if (!region) {
      throw new Error('No active region exists to persist store offers');
    }

    const normalizedDigits = offer.storeId
      .replace(/\D/g, '')
      .padEnd(14, '0')
      .slice(0, 14);
    const cnpj = `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2, 5)}.${normalizedDigits.slice(
      5,
      8,
    )}/${normalizedDigits.slice(8, 12)}-${normalizedDigits.slice(12, 14)}`;

    return this.prisma.establishment.create({
      data: {
        brandName: offer.storeName,
        unitName: offer.storeName,
        cnpj,
        cityName: region.name,
        neighborhood: 'Nao informado',
        regionId: region.id,
        isActive: true,
      },
    });
  }

  private async resolveCatalogProduct(offer: StoreOfferEntity) {
    const slug = this.productNormalizerService.normalize(offer.canonicalName).canonicalName;
    const productSlug = slug.replace(/\s+/g, '-');

    return this.prisma.catalogProduct.upsert({
      where: {
        slug: productSlug,
      },
      update: {
        name: offer.canonicalName,
        defaultUnit: offer.quantityContext ?? undefined,
        isActive: true,
      },
      create: {
        slug: productSlug,
        name: offer.canonicalName,
        category: 'geral',
        defaultUnit: offer.quantityContext ?? undefined,
        isActive: true,
      },
    });
  }

  private async resolveProductVariant(
    offer: StoreOfferEntity,
    catalogProductId: string,
  ) {
    const normalizedDisplayName =
      this.productNormalizerService.normalize(offer.displayName).canonicalName ||
      this.productNormalizerService.normalize(offer.canonicalName).canonicalName;
    const variantSlug = `${normalizedDisplayName.replace(/\s+/g, '-')}-${(offer.quantityContext ?? 'un').replace(/\s+/g, '-')}`;

    return this.prisma.productVariant.upsert({
      where: {
        slug: variantSlug,
      },
      update: {
        catalogProductId,
        displayName: offer.displayName,
        packageLabel: offer.quantityContext ?? undefined,
        isActive: true,
      },
      create: {
        catalogProductId,
        slug: variantSlug,
        displayName: offer.displayName,
        packageLabel: offer.quantityContext ?? undefined,
        isActive: true,
      },
    });
  }
}
