import { Module } from '@nestjs/common';

import { ListsModule } from '../lists/lists.module';
import { OptimizationModule } from '../optimization/optimization.module';
import { ProcessingModule } from '../processing/processing.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { StoresModule } from '../stores/stores.module';
import { OptimizationRunProcessor } from './optimization-run.processor';
import { OptimizationWorkerService } from './optimization-worker.service';
import { ReceiptIngestionProcessor } from './receipt-ingestion.processor';
import { ReceiptWorkerService } from './receipt-worker.service';

@Module({
  imports: [
    ReceiptsModule,
    StoresModule,
    ListsModule,
    OptimizationModule,
    ProcessingModule,
  ],
  providers: [
    ReceiptIngestionProcessor,
    ReceiptWorkerService,
    OptimizationRunProcessor,
    OptimizationWorkerService,
  ],
  exports: [ReceiptIngestionProcessor, OptimizationRunProcessor],
})
export class JobsModule {}
