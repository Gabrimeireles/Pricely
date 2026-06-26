import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { type JwtUserPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { LocationsService } from '../application/locations.service';

class UpsertLocationPreferenceDto {
  @IsString()
  regionId!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  coverageRadiusKm?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsIn(['manual', 'browser_geolocation', 'postal_code_fallback'])
  locationSource?: 'manual' | 'browser_geolocation' | 'postal_code_fallback';
}

class CoveragePreviewDto {
  @IsString()
  regionId!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  coverageRadiusKm?: number;
}

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async list(@CurrentUser() user: JwtUserPayload) {
    return this.locationsService.listPreferences(user.sub);
  }

  @Post()
  async upsert(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: UpsertLocationPreferenceDto,
  ) {
    return this.locationsService.upsertPreference(user.sub, body);
  }

  @Post('coverage-preview')
  async coveragePreview(@Body() body: CoveragePreviewDto) {
    return this.locationsService.previewCoverage(body);
  }
}
