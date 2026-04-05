import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { StoresModule } from '../stores/stores.module';
import { ReceiptsController } from './api/receipts.controller';
import { ReceiptIngestionService } from './application/receipt-ingestion.service';
import { ReceiptParserService } from './application/receipt-parser.service';
import { ReceiptRecordRepository } from './infrastructure/receipt-record.repository';

@Module({
  imports: [CatalogModule, StoresModule],
  controllers: [ReceiptsController],
  providers: [
    ReceiptParserService,
    ReceiptIngestionService,
    ReceiptRecordRepository,
  ],
  exports: [ReceiptParserService, ReceiptIngestionService, ReceiptRecordRepository],
})
export class ReceiptsModule {}
