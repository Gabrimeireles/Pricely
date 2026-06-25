import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { type JwtUserPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ReceiptIngestionService } from '../application/receipt-ingestion.service';
import { ReceiptIngestionDto } from './dto/receipt-ingestion.dto';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(
    private readonly receiptIngestionService: ReceiptIngestionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: ReceiptIngestionDto,
  ) {
    return this.receiptIngestionService.ingest(user.sub, body);
  }

  @Get(':receiptId')
  async detail(
    @CurrentUser() user: JwtUserPayload,
    @Param('receiptId') receiptId: string,
  ) {
    return this.receiptIngestionService.findForUser(user.sub, receiptId);
  }
}
