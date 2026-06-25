import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { type JwtUserPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { MissingProductRequestsService } from '../application/missing-product-requests.service';

class CreateMissingProductRequestDto {
  @IsString()
  @MaxLength(160)
  requestedName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryHint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  packageHint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller('missing-product-requests')
@UseGuards(JwtAuthGuard)
export class MissingProductRequestsController {
  constructor(private readonly service: MissingProductRequestsService) {}

  @Get()
  list(@CurrentUser() user: JwtUserPayload) {
    return this.service.listForUser(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateMissingProductRequestDto,
  ) {
    return this.service.create(user.sub, body);
  }
}
