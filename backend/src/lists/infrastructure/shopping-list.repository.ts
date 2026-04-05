import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Db } from 'mongodb';

import { MONGO_DB } from '../../persistence/mongo.config';
import { type ShoppingListEntity, type ShoppingListItemEntity } from '../domain/shopping-list.entity';
import { SHOPPING_LISTS_COLLECTION, type ShoppingListDocument } from './shopping-list.schema';

@Injectable()
export class ShoppingListRepository {
  private readonly collection: Collection<ShoppingListDocument>;

  constructor(@Inject(MONGO_DB) db: Db) {
    this.collection = db.collection<ShoppingListDocument>(SHOPPING_LISTS_COLLECTION);
  }

  async create(list: ShoppingListEntity): Promise<ShoppingListEntity> {
    await this.collection.insertOne(list);
    return list;
  }

  async list(): Promise<ShoppingListEntity[]> {
    return this.collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  async findById(id: string): Promise<ShoppingListEntity | null> {
    return this.collection.findOne({ id });
  }

  async appendItems(
    id: string,
    items: ShoppingListItemEntity[],
    status: ShoppingListEntity['status'],
    updatedAt: string,
  ): Promise<ShoppingListEntity | null> {
    await this.collection.updateOne(
      { id },
      {
        $push: { items: { $each: items } },
        $set: {
          status,
          updatedAt,
        },
      },
    );

    return this.findById(id);
  }

  async updateStatus(id: string, status: ShoppingListEntity['status']): Promise<void> {
    await this.collection.updateOne(
      { id },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    );
  }
}
