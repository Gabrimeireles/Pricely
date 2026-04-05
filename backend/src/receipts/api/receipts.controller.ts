import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ReceiptIngestionService } from '../application/receipt-ingestion.service';
import { ReceiptIngestionDto } from './dto/receipt-ingestion.dto';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptIngestionService: ReceiptIngestionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(@Body() body: ReceiptIngestionDto) {
    return this.receiptIngestionService.ingest(body);
  }
}
