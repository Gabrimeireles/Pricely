import { Module } from '@nestjs/common';

import { ReceiptsModule } from '../receipts/receipts.module';
import { StoresModule } from '../stores/stores.module';
import { ReceiptIngestionProcessor } from './receipt-ingestion.processor';

@Module({
  imports: [ReceiptsModule, StoresModule],
  providers: [ReceiptIngestionProcessor],
  exports: [ReceiptIngestionProcessor],
})
export class JobsModule {}
