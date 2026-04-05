import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Db } from 'mongodb';

import { MONGO_DB } from '../../persistence/mongo.config';
import { type ProductMatchEntity } from '../domain/product-match.entity';
import { PRODUCT_MATCHES_COLLECTION, type ProductMatchDocument } from './product-match.schema';

@Injectable()
export class ProductMatchRepository {
  private readonly collection: Collection<ProductMatchDocument>;

  constructor(@Inject(MONGO_DB) db: Db) {
    this.collection = db.collection<ProductMatchDocument>(PRODUCT_MATCHES_COLLECTION);
  }

  async findByAlias(alias: string): Promise<ProductMatchEntity | null> {
    return this.collection.findOne({ alias });
  }

  async upsert(match: ProductMatchEntity): Promise<ProductMatchEntity> {
    await this.collection.updateOne(
      { alias: match.alias },
      {
        $set: match,
      },
      { upsert: true },
    );

    return match;
  }
}
