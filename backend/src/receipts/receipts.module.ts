import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { ReceiptParserService } from './application/receipt-parser.service';

@Module({
  imports: [CatalogModule],
  providers: [ReceiptParserService],
  exports: [ReceiptParserService],
})
export class ReceiptsModule {}
