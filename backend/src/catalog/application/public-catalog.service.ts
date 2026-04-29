import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';
import {
  type CatalogProductDetailContract,
  type CatalogProductSummary,
  type CatalogProductVariantSummary,
} from '../../common/contracts';
import { CatalogProductsService } from './catalog-products.service';

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogProductsService: CatalogProductsService,
  ) {}

  async searchCatalogProducts(query: string): Promise<CatalogProductSummary[]> {
    return this.catalogProductsService.searchCatalogProducts(query);
  }

  async listVariants(catalogProductId: string): Promise<CatalogProductVariantSummary[]> {
    const catalogProduct = await this.prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
      select: { id: true },
    });

    if (!catalogProduct) {
      throw new NotFoundException(`Catalog product ${catalogProductId} was not found`);
    }

    const variants = await this.catalogProductsService.listVariants(catalogProductId);
    return variants.filter((variant) => variant.isActive);
  }

  async getCatalogProductDetail(
    catalogProductId: string,
  ): Promise<CatalogProductDetailContract> {
    const catalogProduct = await this.catalogProductsService.getCatalogProductDetail(
      catalogProductId,
    );

    if (!catalogProduct || !catalogProduct.isActive) {
      throw new NotFoundException(`Catalog product ${catalogProductId} was not found`);
    }

    const offers = await this.prisma.productOffer.findMany({
      where: {
        catalogProductId,
        isActive: true,
        availabilityStatus: 'available',
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
        establishment: {
          include: {
            region: true,
          },
        },
        productVariant: true,
      },
      orderBy: [{ priceAmount: 'asc' }, { observedAt: 'desc' }],
    });

    return {
      catalogProduct: {
        id: catalogProduct.id,
        slug: catalogProduct.slug,
        name: catalogProduct.name,
        category: catalogProduct.category,
        defaultUnit: catalogProduct.defaultUnit,
        imageUrl: catalogProduct.imageUrl,
        isActive: catalogProduct.isActive,
      },
      variants: catalogProduct.productVariants,
      offers: offers.map((offer) => ({
        id: offer.id,
        catalogProductId: offer.catalogProductId,
        productVariantId: offer.productVariantId,
        displayName: offer.displayName,
        priceAmount: Number(offer.priceAmount),
        observedAt: offer.observedAt.toISOString(),
        confidenceLevel: offer.confidenceLevel,
        packageLabel: offer.packageLabel,
        storeName: offer.establishment.unitName,
        neighborhood: offer.establishment.neighborhood,
        region: {
          id: offer.establishment.region.id,
          slug: offer.establishment.region.slug,
          name: offer.establishment.region.name,
          stateCode: offer.establishment.region.stateCode,
        },
      })),
    };
  }
}
