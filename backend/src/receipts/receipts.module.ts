import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { ProcessingModule } from '../processing/processing.module';
import { StoresModule } from '../stores/stores.module';
import { ReceiptsController } from './api/receipts.controller';
import {
  OCR_RECEIPT_EXTRACTOR,
  UnsupportedOcrReceiptExtractor,
} from './application/ocr-receipt-extractor';
import {
  RECEIPT_PROVIDER,
  UnsupportedReceiptProvider,
} from './application/receipt-provider';
import { QrCodeParserService } from './application/qr-code-parser.service';
import { ReceiptIngestionService } from './application/receipt-ingestion.service';
import { ReceiptParserService } from './application/receipt-parser.service';
import { ReceiptSanitizerService } from './application/receipt-sanitizer.service';
import { ReceiptRecordRepository } from './infrastructure/receipt-record.repository';

@Module({
  imports: [CatalogModule, StoresModule, ProcessingModule],
  controllers: [ReceiptsController],
  providers: [
    ReceiptParserService,
    ReceiptSanitizerService,
    QrCodeParserService,
    ReceiptIngestionService,
    ReceiptRecordRepository,
    {
      provide: RECEIPT_PROVIDER,
      useClass: UnsupportedReceiptProvider,
    },
    {
      provide: OCR_RECEIPT_EXTRACTOR,
      useClass: UnsupportedOcrReceiptExtractor,
    },
  ],
  exports: [
    ReceiptParserService,
    ReceiptSanitizerService,
    QrCodeParserService,
    ReceiptIngestionService,
    ReceiptRecordRepository,
    RECEIPT_PROVIDER,
    OCR_RECEIPT_EXTRACTOR,
  ],
})
export class ReceiptsModule {}
