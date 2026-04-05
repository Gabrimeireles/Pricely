import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Db } from 'mongodb';

import { MONGO_DB } from '../../persistence/mongo.config';
import { type StoreOfferEntity } from '../domain/store-offer.entity';
import { STORE_OFFERS_COLLECTION, type StoreOfferDocument } from './store-offer.schema';

@Injectable()
export class StoreOfferRepository {
  private readonly collection: Collection<StoreOfferDocument>;

  constructor(@Inject(MONGO_DB) db: Db) {
    this.collection = db.collection<StoreOfferDocument>(STORE_OFFERS_COLLECTION);
  }

  async upsert(offer: StoreOfferEntity): Promise<StoreOfferEntity> {
    await this.collection.updateOne(
      { id: offer.id },
      {
        $set: offer,
      },
      { upsert: true },
    );

    return offer;
  }

  async findByCanonicalNames(canonicalNames: string[]): Promise<StoreOfferEntity[]> {
    return this.collection
      .find({
        canonicalName: { $in: canonicalNames },
      })
      .toArray();
  }
}
