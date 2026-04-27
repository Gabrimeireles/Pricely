import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';
import { PrismaService } from '../../persistence/prisma.service';
import {
  type ShoppingListEntity,
  type ShoppingListItemEntity,
  type ShoppingListStatus,
} from '../domain/shopping-list.entity';

const shoppingListInclude = {
  preferredRegion: true,
  shoppingListItems: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      catalogProduct: true,
      lockedProductVariant: true,
    },
  },
  optimizationRuns: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
} satisfies Prisma.ShoppingListInclude;

type ShoppingListRecord = Prisma.ShoppingListGetPayload<{
  include: typeof shoppingListInclude;
}>;

@Injectable()
export class ShoppingListRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productNormalizerService: ProductNormalizerService,
  ) {}

  async create(data: {
    userId: string;
    name: string;
    preferredRegionId?: string;
    lastMode: 'local' | 'global_unique' | 'global_full';
  }): Promise<ShoppingListEntity> {
    const list = await this.prisma.shoppingList.create({
      data: {
        userId: data.userId,
        name: data.name,
        preferredRegionId: data.preferredRegionId ?? null,
        status: 'draft',
      },
      include: shoppingListInclude,
    });

    return this.toEntity(list, data.lastMode);
  }

  async listByUser(userId: string): Promise<ShoppingListEntity[]> {
    const lists = await this.prisma.shoppingList.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
      include: shoppingListInclude,
    });

    return lists.map((list) => this.toEntity(list));
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<ShoppingListEntity | null> {
    const list = await this.prisma.shoppingList.findFirst({
      where: {
        id,
        userId,
      },
      include: shoppingListInclude,
    });

    return list ? this.toEntity(list) : null;
  }

  async appendItems(
    id: string,
    userId: string,
    items: ShoppingListItemEntity[],
    status: ShoppingListStatus,
  ): Promise<ShoppingListEntity | null> {
    const existing = await this.findByIdForUser(id, userId);

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.shoppingList.update({
      where: {
        id,
      },
      data: {
        status,
        shoppingListItems: {
          create: items.map((item) => ({
            id: item.id,
            catalogProductId: item.catalogProductId ?? null,
            lockedProductVariantId: item.lockedProductVariantId ?? null,
            brandPreferenceMode: item.brandPreferenceMode,
            preferredBrandNames: item.preferredBrandNames,
            requestedName: item.requestedName,
            quantity:
              item.quantity !== undefined ? new Prisma.Decimal(item.quantity) : null,
            unitLabel: item.unitLabel ?? null,
            notes: item.notes ?? null,
            purchaseStatus: item.purchaseStatus,
            purchasedAt: item.purchasedAt ? new Date(item.purchasedAt) : null,
            resolutionStatus: item.resolutionStatus,
          })),
        },
      },
      include: shoppingListInclude,
    });

    return this.toEntity(updated, existing.lastMode);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: ShoppingListStatus,
  ): Promise<void> {
    await this.prisma.shoppingList.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        status,
      },
    });
  }

  async replace(
    id: string,
    userId: string,
    data: {
      name?: string;
      preferredRegionId?: string;
      lastMode?: 'local' | 'global_unique' | 'global_full';
      items: ShoppingListItemEntity[];
    },
  ): Promise<ShoppingListEntity | null> {
    const existing = await this.findByIdForUser(id, userId);

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.shoppingList.update({
      where: {
        id,
      },
      data: {
        name: data.name ?? existing.name,
        preferredRegionId:
          data.preferredRegionId !== undefined
            ? data.preferredRegionId
            : existing.preferredRegionId ?? null,
        shoppingListItems: {
          deleteMany: {},
          create: data.items.map((item) => ({
            id: item.id,
            catalogProductId: item.catalogProductId ?? null,
            lockedProductVariantId: item.lockedProductVariantId ?? null,
            brandPreferenceMode: item.brandPreferenceMode,
            preferredBrandNames: item.preferredBrandNames,
            requestedName: item.requestedName,
            quantity:
              item.quantity !== undefined ? new Prisma.Decimal(item.quantity) : null,
            unitLabel: item.unitLabel ?? null,
            notes: item.notes ?? null,
            purchaseStatus: item.purchaseStatus,
            purchasedAt: item.purchasedAt ? new Date(item.purchasedAt) : null,
            resolutionStatus: item.resolutionStatus,
          })),
        },
      },
      include: shoppingListInclude,
    });

    return this.toEntity(updated, data.lastMode ?? existing.lastMode);
  }

  private toEntity(
    record: ShoppingListRecord,
    fallbackMode: 'local' | 'global_unique' | 'global_full' = 'global_full',
  ): ShoppingListEntity {
    const latestRun = record.optimizationRuns[0];

    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      preferredRegionId: record.preferredRegion?.slug ?? undefined,
      status: record.status,
      lastMode: latestRun?.mode ?? fallbackMode,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      items: record.shoppingListItems.map((item) => ({
        id: item.id,
        catalogProductId: item.catalogProductId ?? undefined,
        lockedProductVariantId: item.lockedProductVariantId ?? undefined,
        brandPreferenceMode: item.brandPreferenceMode,
        preferredBrandNames: item.preferredBrandNames,
        imageUrl:
          item.lockedProductVariant?.imageUrl ??
          item.catalogProduct?.imageUrl ??
          undefined,
        requestedName: item.requestedName,
        normalizedName: this.productNormalizerService.normalize(item.requestedName)
          .canonicalName,
        quantity: item.quantity ? Number(item.quantity) : undefined,
        unitLabel: item.unitLabel ?? undefined,
        notes: item.notes ?? undefined,
        purchaseStatus: item.purchaseStatus,
        purchasedAt: item.purchasedAt?.toISOString(),
        resolutionStatus: item.resolutionStatus,
      })),
    };
  }
}
