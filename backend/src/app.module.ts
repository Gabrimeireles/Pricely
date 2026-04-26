import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { JobsModule } from './jobs/jobs.module';
import { ListsModule } from './lists/lists.module';
import { LoggingModule } from './common/logging/logging.module';
import { QueueModule } from './common/queue/queue.module';
import { OptimizationModule } from './optimization/optimization.module';

import { MongoModule } from './persistence/mongo.module';
import { PrismaModule } from './persistence/prisma.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    LoggingModule,
    PrismaModule,
    MongoModule,
    AuthModule,
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
