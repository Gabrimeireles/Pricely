import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Queue } from 'bullmq';

import { HttpExceptionFilter } from '../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../src/common/validation/validation.pipe';
import {
  OPTIMIZATION_QUEUE,
  RECEIPT_PROCESSING_QUEUE,
} from '../../src/common/queue/queue.tokens';
import { QueueModule } from '../../src/common/queue/queue.module';
import { CatalogModule } from '../../src/catalog/catalog.module';
import { ProductMatchRepository } from '../../src/catalog/infrastructure/product-match.repository';
import { JobsModule } from '../../src/jobs/jobs.module';
import { ListsModule } from '../../src/lists/lists.module';
import { OptimizationModule } from '../../src/optimization/optimization.module';
import { OptimizationResultRepository } from '../../src/optimization/infrastructure/optimization-result.repository';
import { ReceiptsModule } from '../../src/receipts/receipts.module';
import { ReceiptRecordRepository } from '../../src/receipts/infrastructure/receipt-record.repository';
import { StoresModule } from '../../src/stores/stores.module';
import { ShoppingListRepository } from '../../src/lists/infrastructure/shopping-list.repository';
import { StoreOfferRepository } from '../../src/stores/infrastructure/store-offer.repository';

type QueueStub = Pick<Queue, 'add'>;

class InMemoryShoppingListRepository {
  private readonly lists = new Map<string, any>();

  async create(list: any) {
    this.lists.set(list.id, structuredClone(list));
    return structuredClone(list);
  }

  async list() {
    return Array.from(this.lists.values()).map((entry) => structuredClone(entry));
  }

  async findById(id: string) {
    const value = this.lists.get(id);
    return value ? structuredClone(value) : null;
  }

  async appendItems(id: string, items: any[], status: string, updatedAt: string) {
    const existing = this.lists.get(id);
    if (!existing) {
      return null;
    }

    existing.items.push(...structuredClone(items));
    existing.status = status;
    existing.updatedAt = updatedAt;
    this.lists.set(id, existing);
    return structuredClone(existing);
  }

  async updateStatus(id: string, status: string) {
    const existing = this.lists.get(id);
    if (!existing) {
      return;
    }

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    this.lists.set(id, existing);
  }
}

class InMemoryReceiptRecordRepository {
  private readonly records = new Map<string, any>();

  async create(record: any) {
    this.records.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async findById(id: string) {
    const value = this.records.get(id);
    return value ? structuredClone(value) : null;
  }
}

class InMemoryProductMatchRepository {
  private readonly matches = new Map<string, any>();

  async findByAlias(alias: string) {
    const value = this.matches.get(alias);
    return value ? structuredClone(value) : null;
  }

  async upsert(match: any) {
    this.matches.set(match.alias, structuredClone(match));
    return structuredClone(match);
  }
}

class InMemoryStoreOfferRepository {
  private readonly offers = new Map<string, any>();

  async upsert(offer: any) {
    this.offers.set(offer.id, structuredClone(offer));
    return structuredClone(offer);
  }

  async findByCanonicalNames(canonicalNames: string[]) {
    return Array.from(this.offers.values())
      .filter((offer) => canonicalNames.includes(offer.canonicalName))
      .map((offer) => structuredClone(offer));
  }
}

class InMemoryOptimizationResultRepository {
  private readonly results: any[] = [];

  async save(result: any) {
    this.results.push(structuredClone(result));
    return structuredClone(result);
  }

  async findLatestByShoppingListId(shoppingListId: string) {
    const latest = [...this.results]
      .filter((result) => result.shoppingListId === shoppingListId)
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))[0];

    return latest ? structuredClone(latest) : null;
  }
}

export async function createUs1TestApp(): Promise<{
  app: INestApplication;
  queues: {
    receiptQueue: QueueStub;
    optimizationQueue: QueueStub;
  };
}> {
  const receiptQueue: QueueStub = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  const optimizationQueue: QueueStub = {
    add: jest.fn().mockResolvedValue(undefined),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [
      QueueModule,
      CatalogModule,
      ListsModule,
      StoresModule,
      ReceiptsModule,
      OptimizationModule,
      JobsModule,
    ],
  })
    .overrideProvider(RECEIPT_PROCESSING_QUEUE)
    .useValue(receiptQueue)
    .overrideProvider(OPTIMIZATION_QUEUE)
    .useValue(optimizationQueue)
    .overrideProvider(ShoppingListRepository)
    .useValue(new InMemoryShoppingListRepository())
    .overrideProvider(ReceiptRecordRepository)
    .useValue(new InMemoryReceiptRecordRepository())
    .overrideProvider(ProductMatchRepository)
    .useValue(new InMemoryProductMatchRepository())
    .overrideProvider(StoreOfferRepository)
    .useValue(new InMemoryStoreOfferRepository())
    .overrideProvider(OptimizationResultRepository)
    .useValue(new InMemoryOptimizationResultRepository())
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return {
    app,
    queues: {
      receiptQueue,
      optimizationQueue,
    },
  };
}
