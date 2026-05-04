import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../persistence/prisma.service';
import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';
import { type StoreOfferEntity } from '../domain/store-offer.entity';

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
      },
    });

    return activeOffers
      .map((offer) => {
        const normalizedProductName = this.productNormalizerService.normalize(
          offer.catalogProduct.name,
        ).canonicalName;

        return {
          id: offer.id,
          catalogProductId: offer.catalogProductId,
          productVariantId: offer.productVariantId,
          brandName: offer.productVariant.brandName ?? undefined,
          variantName: offer.productVariant.displayName,
          storeId: offer.establishmentId,
          storeName: offer.establishment.unitName,
          canonicalName: normalizedProductName,
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
          confidenceScore:
            offer.confidenceLevel === 'high'
              ? 0.95
              : offer.confidenceLevel === 'medium'
                ? 0.7
                : 0.45,
          sourceReceiptLineItemId: offer.sourceReference ?? offer.sourceType,
          observedAt: offer.observedAt.toISOString(),
        } satisfies StoreOfferEntity;
      })
      .filter((offer) => canonicalNames.includes(offer.canonicalName));
  }

  async findByListItems(
    items: Array<{ catalogProductId?: string; normalizedName?: string }>,
  ): Promise<StoreOfferEntity[]> {
    const catalogProductIds = new Set(items.map((item) => item.catalogProductId).filter(Boolean));
    const canonicalNames = new Set(items.map((item) => item.normalizedName).filter(Boolean));

    if (catalogProductIds.size === 0 && canonicalNames.size === 0) {
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
      },
    });

    return activeOffers
      .map((offer) => {
        const normalizedProductName = this.productNormalizerService.normalize(
          offer.catalogProduct.name,
        ).canonicalName;

        return {
          id: offer.id,
          catalogProductId: offer.catalogProductId,
          productVariantId: offer.productVariantId,
          brandName: offer.productVariant.brandName ?? undefined,
          variantName: offer.productVariant.displayName,
          storeId: offer.establishmentId,
          storeName: offer.establishment.unitName,
          canonicalName: normalizedProductName,
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
          confidenceScore:
            offer.confidenceLevel === 'high'
              ? 0.95
              : offer.confidenceLevel === 'medium'
                ? 0.7
                : 0.45,
          sourceReceiptLineItemId: offer.sourceReference ?? offer.sourceType,
          observedAt: offer.observedAt.toISOString(),
        } satisfies StoreOfferEntity;
      })
      .filter(
        (offer) =>
          (offer.catalogProductId && catalogProductIds.has(offer.catalogProductId)) ||
          canonicalNames.has(offer.canonicalName),
      );
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
