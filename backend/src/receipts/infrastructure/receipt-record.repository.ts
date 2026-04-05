import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Db } from 'mongodb';

import { MONGO_DB } from '../../persistence/mongo.config';
import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';
import { RECEIPT_RECORDS_COLLECTION, type ReceiptRecordDocument } from './receipt-record.schema';

@Injectable()
export class ReceiptRecordRepository {
  private readonly collection: Collection<ReceiptRecordDocument>;

  constructor(@Inject(MONGO_DB) db: Db) {
    this.collection = db.collection<ReceiptRecordDocument>(RECEIPT_RECORDS_COLLECTION);
  }

  async create(record: ReceiptRecordEntity): Promise<ReceiptRecordEntity> {
    await this.collection.insertOne(record);
    return record;
  }

  async findById(id: string): Promise<ReceiptRecordEntity | null> {
    return this.collection.findOne({ id });
  }
}
