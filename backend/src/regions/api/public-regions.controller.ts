import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PublicRegionsService } from '../application/public-regions.service';

class CityInclusionRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  cityName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  stateCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

@Controller('regions')
export class PublicRegionsController {
  constructor(private readonly publicRegionsService: PublicRegionsService) {}

  @Get()
  async list() {
    return this.publicRegionsService.listVisibleRegions();
  }

  @Get('impact')
  async impact() {
    return this.publicRegionsService.getPublicImpact();
  }

  @Post('requests')
  async requestCity(@Body() body: CityInclusionRequestDto) {
    return this.publicRegionsService.requestCityInclusion(body);
  }
}
