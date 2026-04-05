import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Db } from 'mongodb';

import { MONGO_DB } from '../../persistence/mongo.config';
import { type OptimizationResultEntity } from '../domain/optimization-selection.entity';

const OPTIMIZATION_RESULTS_COLLECTION = 'optimization_results';

@Injectable()
export class OptimizationResultRepository {
  private readonly collection: Collection<OptimizationResultEntity>;

  constructor(@Inject(MONGO_DB) db: Db) {
    this.collection = db.collection<OptimizationResultEntity>(OPTIMIZATION_RESULTS_COLLECTION);
  }

  async save(result: OptimizationResultEntity): Promise<OptimizationResultEntity> {
    await this.collection.insertOne(result);
    return result;
  }

  async findLatestByShoppingListId(
    shoppingListId: string,
  ): Promise<OptimizationResultEntity | null> {
    return this.collection
      .find({ shoppingListId })
      .sort({ generatedAt: -1 })
      .limit(1)
      .next();
  }
}
