import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { EstablishmentsModule } from './establishments/establishments.module';
import { JobsModule } from './jobs/jobs.module';
import { ListsModule } from './lists/lists.module';
import { LoggingModule } from './common/logging/logging.module';
import { QueueModule } from './common/queue/queue.module';
import { OptimizationModule } from './optimization/optimization.module';
import { PrismaModule } from './persistence/prisma.module';
import { PricingModule } from './pricing/pricing.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { RegionsModule } from './regions/regions.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    LoggingModule,
    PrismaModule,
    AuthModule,
    QueueModule,
    ReceiptsModule,
    CatalogModule,
    EstablishmentsModule,
    RegionsModule,
    ListsModule,
    StoresModule,
    PricingModule,
    OptimizationModule,
    AdminModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
