import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  type CreateShoppingListRequest,
  type ShoppingListItemInput,
} from '../../common/contracts';
import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';
import { PrismaService } from '../../persistence/prisma.service';
import {
  type ShoppingListEntity,
  type ShoppingListItemEntity,
} from '../domain/shopping-list.entity';
import { ShoppingListRepository } from '../infrastructure/shopping-list.repository';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ShoppingListsService {
  private readonly logger = new Logger(ShoppingListsService.name);

  constructor(
    private readonly shoppingListRepository: ShoppingListRepository,
    private readonly productNormalizerService: ProductNormalizerService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    request: CreateShoppingListRequest,
  ): Promise<ShoppingListEntity> {
    const preferredRegionId = await this.resolveRegionId(request.preferredRegionId);
    try {
      return await this.shoppingListRepository.create({
        userId,
        name: request.name.trim(),
        preferredRegionId,
        lastMode: request.lastMode ?? 'global_full',
      });
    } catch (error) {
      this.logger.error(
        `Failed to create shopping list for user ${userId} with preferred region ${request.preferredRegionId} resolved to ${preferredRegionId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async list(userId: string): Promise<ShoppingListEntity[]> {
    return this.shoppingListRepository.listByUser(userId);
  }

  async addItems(
    userId: string,
    shoppingListId: string,
    items: ShoppingListItemInput[],
  ): Promise<ShoppingListEntity> {
    const list = await this.shoppingListRepository.findByIdForUser(
      shoppingListId,
      userId,
    );

    if (!list) {
      throw new NotFoundException(`Shopping list ${shoppingListId} not found`);
    }

    const preparedItems: ShoppingListItemEntity[] = items.map((item) => {
      const normalized = this.productNormalizerService.normalize(item.requestedName);
      const preferredBrandNames = (item.preferredBrandNames ?? [])
        .map((brand) => brand.trim())
        .filter(Boolean);
      const brandPreferenceMode =
        item.brandPreferenceMode ??
        (item.lockedProductVariantId
          ? 'exact'
          : 'any');

      return {
        id: crypto.randomUUID(),
        catalogProductId: item.catalogProductId,
        lockedProductVariantId: item.lockedProductVariantId,
        brandPreferenceMode,
        preferredBrandNames,
        requestedName: item.requestedName.trim(),
        normalizedName: normalized.canonicalName || undefined,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        notes: item.notes,
        purchaseStatus: item.purchaseStatus ?? 'pending',
        purchasedAt: item.purchaseStatus === 'purchased' ? new Date().toISOString() : undefined,
        resolutionStatus: normalized.canonicalName ? 'matched' : 'unresolved',
      };
    });

    let updated: ShoppingListEntity | null;
    try {
      updated = await this.shoppingListRepository.appendItems(
        shoppingListId,
        userId,
        preparedItems,
        preparedItems.length > 0 ? 'ready' : list.status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to append ${preparedItems.length} items to shopping list ${shoppingListId} for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    if (!updated) {
      throw new NotFoundException(`Shopping list ${shoppingListId} not found`);
    }

    return updated;
  }

  async getById(userId: string, id: string): Promise<ShoppingListEntity> {
    const list = await this.shoppingListRepository.findByIdForUser(id, userId);

    if (!list) {
      throw new NotFoundException(`Shopping list ${id} not found`);
    }

    return list;
  }

  async updateItemPurchaseStatus(
    userId: string,
    shoppingListId: string,
    itemId: string,
    purchaseStatus: 'pending' | 'purchased',
  ): Promise<ShoppingListEntity> {
    const updated = await this.shoppingListRepository.updateItemPurchaseStatus(
      shoppingListId,
      userId,
      itemId,
      purchaseStatus,
    );

    if (!updated) {
      throw new NotFoundException(`Shopping list ${shoppingListId} not found`);
    }

    return updated;
  }

  async replace(
    userId: string,
    id: string,
    input: {
      name?: string;
      preferredRegionId?: string;
      lastMode?: 'local' | 'global_unique' | 'global_full';
      items: ShoppingListItemInput[];
    },
  ): Promise<ShoppingListEntity> {
    const existing = await this.shoppingListRepository.findByIdForUser(id, userId);

    if (!existing) {
      throw new NotFoundException(`Shopping list ${id} not found`);
    }

    const preferredRegionId = await this.resolveRegionId(input.preferredRegionId);

    const items: ShoppingListItemEntity[] = input.items.map((item) => {
      const normalized = this.productNormalizerService.normalize(item.requestedName);
      const preferredBrandNames = (item.preferredBrandNames ?? [])
        .map((brand) => brand.trim())
        .filter(Boolean);
      const brandPreferenceMode =
        item.brandPreferenceMode ??
        (item.lockedProductVariantId
          ? 'exact'
          : 'any');

      return {
        id: crypto.randomUUID(),
        catalogProductId: item.catalogProductId,
        lockedProductVariantId: item.lockedProductVariantId,
        brandPreferenceMode,
        preferredBrandNames,
        requestedName: item.requestedName.trim(),
        normalizedName: normalized.canonicalName || undefined,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        notes: item.notes,
        purchaseStatus: item.purchaseStatus ?? 'pending',
        purchasedAt: item.purchaseStatus === 'purchased' ? new Date().toISOString() : undefined,
        resolutionStatus: normalized.canonicalName ? 'matched' : 'unresolved',
      };
    });

    const updated = await this.shoppingListRepository.replace(id, userId, {
      name: input.name,
      preferredRegionId,
      lastMode: input.lastMode,
      items,
    });

    if (!updated) {
      throw new NotFoundException(`Shopping list ${id} not found`);
    }

    return updated;
  }

  private async resolveRegionId(
    regionReference?: string,
  ): Promise<string | undefined> {
    if (!regionReference) {
      return undefined;
    }

    if (UUID_PATTERN.test(regionReference)) {
      const directMatch = await this.prisma.region.findUnique({
        where: { id: regionReference },
        select: { id: true },
      });

      if (directMatch) {
        return directMatch.id;
      }
    }

    const slugMatch = await this.prisma.region.findUnique({
      where: { slug: regionReference },
      select: { id: true },
    });

    return slugMatch?.id;
  }
}
