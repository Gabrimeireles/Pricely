import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { toSlug } from '../../common/utils/slug.util';
import { type ProductMatchEntity } from '../domain/product-match.entity';

@Injectable()
export class ProductMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAlias(alias: string): Promise<ProductMatchEntity | null> {
    const normalizedAlias = alias.trim().toLowerCase();
    const record = await this.prisma.catalogProductAlias.findFirst({
      where: {
        alias: normalizedAlias,
      },
      include: {
        catalogProduct: true,
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      alias: record.alias,
      canonicalName: record.catalogProduct.name,
      sizeDescriptor: record.catalogProduct.defaultUnit ?? undefined,
      confidenceScore: Number(record.confidenceScore),
      source:
        record.sourceType === 'rule'
          ? 'rule_based_normalization'
          : record.sourceType === 'admin'
            ? 'user_confirmation'
            : 'historical_inference',
      lastSeenAt: record.createdAt.toISOString(),
    };
  }

  async upsert(match: ProductMatchEntity): Promise<ProductMatchEntity> {
    const productSlug = toSlug(match.canonicalName) || `produto-${crypto.randomUUID()}`;

    const product = await this.prisma.catalogProduct.upsert({
      where: {
        slug: productSlug,
      },
      update: {
        name: match.canonicalName,
        defaultUnit: match.sizeDescriptor ?? undefined,
      },
      create: {
        slug: productSlug,
        name: match.canonicalName,
        category: 'geral',
        defaultUnit: match.sizeDescriptor ?? undefined,
        isActive: true,
      },
    });

    await this.prisma.catalogProductAlias.upsert({
      where: {
        catalogProductId_alias: {
          catalogProductId: product.id,
          alias: match.alias.trim().toLowerCase(),
        },
      },
      update: {
        confidenceScore: match.confidenceScore,
        sourceType:
          match.source === 'rule_based_normalization'
            ? 'rule'
            : match.source === 'user_confirmation'
              ? 'admin'
              : 'receipt',
      },
      create: {
        catalogProductId: product.id,
        alias: match.alias.trim().toLowerCase(),
        confidenceScore: match.confidenceScore,
        sourceType:
          match.source === 'rule_based_normalization'
            ? 'rule'
            : match.source === 'user_confirmation'
              ? 'admin'
              : 'receipt',
      },
    });

    return match;
  }
}
