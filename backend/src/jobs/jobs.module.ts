import { Module } from '@nestjs/common';

import { ListsModule } from '../lists/lists.module';
import { OptimizationModule } from '../optimization/optimization.module';
import { ProcessingModule } from '../processing/processing.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { StoresModule } from '../stores/stores.module';
import { UsersModule } from '../users/users.module';
import { OptimizationRunProcessor } from './optimization-run.processor';
import { OptimizationWorkerService } from './optimization-worker.service';
import { ReceiptIngestionProcessor } from './receipt-ingestion.processor';
import { ReceiptWorkerService } from './receipt-worker.service';
import { MonthlyTokenRefillService } from './monthly-token-refill.service';

@Module({
  imports: [
    ReceiptsModule,
    StoresModule,
    ListsModule,
    OptimizationModule,
    ProcessingModule,
    UsersModule,
  ],
  providers: [
    ReceiptIngestionProcessor,
    ReceiptWorkerService,
    OptimizationRunProcessor,
    OptimizationWorkerService,
    MonthlyTokenRefillService,
  ],
  exports: [
    ReceiptIngestionProcessor,
    OptimizationRunProcessor,
    MonthlyTokenRefillService,
  ],
})
export class JobsModule {}
