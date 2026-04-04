import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { JobsModule } from './jobs/jobs.module';
import { ListsModule } from './lists/lists.module';
import { LoggingModule } from './common/logging/logging.module';
import { QueueModule } from './common/queue/queue.module';
import { OptimizationModule } from './optimization/optimization.module';

import { MongoModule } from './persistence/mongo.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    LoggingModule,
    MongoModule,
    QueueModule,
    ReceiptsModule,
    CatalogModule,
    ListsModule,
    StoresModule,
    OptimizationModule,
    AdminModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
