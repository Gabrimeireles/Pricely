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
    const searchFilter = normalizedQuery
      ? {
          OR: [
            { name: { contains: normalizedQuery, mode: 'insensitive' as const } },
            { aliases: { some: { alias: { contains: normalizedQuery.toLowerCase() } } } },
            {
              productVariants: {
                some: {
                  isActive: true,
                  OR: [
                    { displayName: { contains: normalizedQuery, mode: 'insensitive' as const } },
                    { brandName: { contains: normalizedQuery, mode: 'insensitive' as const } },
                  ],
                },
              },
            },
          ],
        }
      : {};

    return this.prisma.catalogProduct.findMany({
      where: {
        isActive: true,
        ...searchFilter,
      },
      include: {
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
          take: 6,
        },
      },
      orderBy: [{ name: 'asc' }],
      take: normalizedQuery ? 20 : 40,
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
