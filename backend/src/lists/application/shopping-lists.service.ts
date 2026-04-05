import { Injectable, NotFoundException } from '@nestjs/common';

import {
  type CreateShoppingListRequest,
  type ShoppingListItemInput,
} from '../../common/contracts';
import { toSlug } from '../../common/utils/slug.util';
import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';
import {
  type ShoppingListEntity,
  type ShoppingListItemEntity,
} from '../domain/shopping-list.entity';
import { ShoppingListRepository } from '../infrastructure/shopping-list.repository';

@Injectable()
export class ShoppingListsService {
  constructor(
    private readonly shoppingListRepository: ShoppingListRepository,
    private readonly productNormalizerService: ProductNormalizerService,
  ) {}

  async create(request: CreateShoppingListRequest): Promise<ShoppingListEntity> {
    const timestamp = new Date().toISOString();
    const list: ShoppingListEntity = {
      id: `sl_${crypto.randomUUID()}`,
      name: request.name.trim(),
      mode: request.mode,
      preferredStoreId: request.preferredStoreId,
      locationHint: request.locationHint,
      status: 'draft',
      items: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.shoppingListRepository.create(list);
  }

  async list(): Promise<ShoppingListEntity[]> {
    return this.shoppingListRepository.list();
  }

  async addItems(
    shoppingListId: string,
    items: ShoppingListItemInput[],
  ): Promise<ShoppingListEntity> {
    const list = await this.shoppingListRepository.findById(shoppingListId);

    if (!list) {
      throw new NotFoundException(`Shopping list ${shoppingListId} not found`);
    }

    const preparedItems: ShoppingListItemEntity[] = items.map((item) => {
      const normalized = this.productNormalizerService.normalize(item.requestedName);

      return {
        id: `sli_${toSlug(item.requestedName)}_${crypto.randomUUID().slice(0, 8)}`,
        requestedName: item.requestedName.trim(),
        normalizedName: normalized.canonicalName || undefined,
        quantity: item.quantity,
        unit: item.unit,
        preferredBrand: item.preferredBrand,
        notes: item.notes,
        resolutionStatus: normalized.canonicalName ? 'matched' : 'unresolved',
      };
    });

    const updated = await this.shoppingListRepository.appendItems(
      shoppingListId,
      preparedItems,
      preparedItems.length > 0 ? 'ready' : list.status,
      new Date().toISOString(),
    );

    if (!updated) {
      throw new NotFoundException(`Shopping list ${shoppingListId} not found`);
    }

    return updated;
  }

  async getById(id: string): Promise<ShoppingListEntity> {
    const list = await this.shoppingListRepository.findById(id);

    if (!list) {
      throw new NotFoundException(`Shopping list ${id} not found`);
    }

    return list;
  }
}
