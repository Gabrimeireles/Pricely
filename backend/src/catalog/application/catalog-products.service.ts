import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class CatalogProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    return this.prisma.catalogProduct.findMany({
      include: {
        aliases: true,
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
        },
        _count: {
          select: {
            productOffers: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createProduct(input: {
    slug: string;
    name: string;
    category: string;
    defaultUnit?: string;
    imageUrl?: string;
    alias?: string;
  }) {
    return this.prisma.catalogProduct.create({
      data: {
        slug: input.slug,
        name: input.name,
        category: input.category,
        defaultUnit: input.defaultUnit,
        imageUrl: input.imageUrl,
        isActive: true,
        aliases: input.alias
          ? {
              create: {
                alias: input.alias,
                sourceType: 'admin',
                confidenceScore: 1,
              },
            }
          : undefined,
      },
      include: {
        aliases: true,
      },
    });
  }

  async updateProduct(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      category: string;
      defaultUnit: string;
      imageUrl: string;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.catalogProduct.update({
      where: { id },
      data: input,
      include: {
        aliases: true,
      },
    });
  }

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

  async getCatalogProductDetail(catalogProductId: string) {
    return this.prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
      include: {
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
        },
      },
    });
  }

  async listVariants(catalogProductId: string) {
    return this.prisma.productVariant.findMany({
      where: {
        catalogProductId,
      },
      orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
    });
  }

  async createVariant(input: {
    catalogProductId: string;
    slug: string;
    displayName: string;
    brandName?: string;
    variantLabel?: string;
    packageLabel?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    return this.prisma.productVariant.create({
      data: {
        ...input,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateVariant(
    id: string,
    input: Partial<{
      catalogProductId: string;
      slug: string;
      displayName: string;
      brandName: string;
      variantLabel: string;
      packageLabel: string;
      imageUrl: string;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.productVariant.update({
      where: { id },
      data: input,
    });
  }
}
