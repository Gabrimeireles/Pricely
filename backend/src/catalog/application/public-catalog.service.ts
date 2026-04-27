import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCatalogProducts(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    return this.prisma.catalogProduct.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { aliases: { some: { alias: { contains: normalizedQuery.toLowerCase() } } } },
          {
            productVariants: {
              some: {
                isActive: true,
                OR: [
                  { displayName: { contains: normalizedQuery, mode: 'insensitive' } },
                  { brandName: { contains: normalizedQuery, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      },
      include: {
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
          take: 6,
        },
      },
      orderBy: [{ name: 'asc' }],
      take: 20,
    });
  }

  async listVariants(catalogProductId: string) {
    const catalogProduct = await this.prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
      select: { id: true },
    });

    if (!catalogProduct) {
      throw new NotFoundException(`Catalog product ${catalogProductId} was not found`);
    }

    return this.prisma.productVariant.findMany({
      where: {
        catalogProductId,
        isActive: true,
      },
      orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
    });
  }

  async getCatalogProductDetail(catalogProductId: string) {
    const catalogProduct = await this.prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
      include: {
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
        },
      },
    });

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
      catalogProduct,
      variants: catalogProduct.productVariants,
      offers: offers.map((offer) => ({
        ...offer,
        priceAmount: Number(offer.priceAmount),
      })),
    };
  }
}
