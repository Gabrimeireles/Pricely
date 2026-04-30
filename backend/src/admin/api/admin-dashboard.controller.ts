import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AdminDashboardService } from '../application/admin-dashboard.service';

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

class CreateRegionDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  @MaxLength(2)
  stateCode!: string;

  @IsIn(['active', 'activating', 'inactive'])
  implantationStatus!: 'active' | 'activating' | 'inactive';

  @IsOptional()
  @IsNumber()
  @Min(0)
  publicSortOrder?: number;
}

class UpdateRegionDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  stateCode?: string;

  @IsOptional()
  @IsIn(['active', 'activating', 'inactive'])
  implantationStatus?: 'active' | 'activating' | 'inactive';

  @IsOptional()
  @IsNumber()
  @Min(0)
  publicSortOrder?: number;
}

class CreateEstablishmentDto {
  @IsString()
  brandName!: string;

  @IsString()
  unitName!: string;

  @IsString()
  cnpj!: string;

  @IsString()
  cityName!: string;

  @IsString()
  neighborhood!: string;

  @IsString()
  regionId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateEstablishmentDto extends CreateEstablishmentDto {}

class CreateProductDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  defaultUnit?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  defaultUnit?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class CreateProductVariantDto {
  @IsString()
  catalogProductId!: string;

  @IsString()
  slug!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  variantLabel?: string;

  @IsOptional()
  @IsString()
  packageLabel?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  catalogProductId?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  variantLabel?: string;

  @IsOptional()
  @IsString()
  packageLabel?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class CreateOfferDto {
  @IsString()
  catalogProductId!: string;

  @IsString()
  productVariantId!: string;

  @IsString()
  establishmentId!: string;

  @IsString()
  displayName!: string;

  @IsString()
  packageLabel!: string;

  @IsNumber()
  @Min(0)
  priceAmount!: number;

  @IsIn(['available', 'unavailable', 'uncertain'])
  availabilityStatus!: 'available' | 'unavailable' | 'uncertain';

  @IsIn(['high', 'medium', 'low'])
  confidenceLevel!: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsOptional()
  @IsString()
  observedAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateOfferDto {
  @IsOptional()
  @IsString()
  catalogProductId?: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  establishmentId?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  packageLabel?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @IsIn(['available', 'unavailable', 'uncertain'])
  availabilityStatus?: 'available' | 'unavailable' | 'uncertain';

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  confidenceLevel?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsOptional()
  @IsString()
  observedAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('metrics')
  async metrics() {
    return this.adminDashboardService.getMetrics();
  }

  @Get('processing-jobs')
  async listProcessingJobs() {
    return this.adminDashboardService.listProcessingJobs();
  }

  @Get('queue-health')
  async queueHealth() {
    return this.adminDashboardService.getQueueHealth();
  }

  @Get('shopping-lists')
  async listShoppingListAudits() {
    return this.adminDashboardService.listShoppingListAudits();
  }

  @Get('regions')
  async listRegions() {
    return this.adminDashboardService.listRegions();
  }

  @Post('regions')
  async createRegion(@Body() body: CreateRegionDto) {
    return this.adminDashboardService.createRegion(body);
  }

  @Patch('regions/:id')
  async updateRegion(@Param('id') id: string, @Body() body: UpdateRegionDto) {
    return this.adminDashboardService.updateRegion(id, body);
  }

  @Get('establishments')
  async listEstablishments() {
    return this.adminDashboardService.listEstablishments();
  }

  @Post('establishments')
  async createEstablishment(@Body() body: CreateEstablishmentDto) {
    return this.adminDashboardService.createEstablishment(body);
  }

  @Patch('establishments/:id')
  async updateEstablishment(
    @Param('id') id: string,
    @Body() body: Partial<UpdateEstablishmentDto>,
  ) {
    return this.adminDashboardService.updateEstablishment(id, body);
  }

  @Get('catalog-products')
  async listProducts() {
    return this.adminDashboardService.listProducts();
  }

  @Post('catalog-products')
  async createProduct(@Body() body: CreateProductDto) {
    return this.adminDashboardService.createProduct(body);
  }

  @Patch('catalog-products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.adminDashboardService.updateProduct(id, body);
  }

  @Post('catalog-products/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCatalogProductImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMediaFile,
  ) {
    return this.adminDashboardService.uploadCatalogProductImage(id, file);
  }

  @Get('product-variants')
  async listProductVariants() {
    return this.adminDashboardService.listProductVariants();
  }

  @Post('product-variants')
  async createProductVariant(@Body() body: CreateProductVariantDto) {
    return this.adminDashboardService.createProductVariant(body);
  }

  @Patch('product-variants/:id')
  async updateProductVariant(
    @Param('id') id: string,
    @Body() body: UpdateProductVariantDto,
  ) {
    return this.adminDashboardService.updateProductVariant(id, body);
  }

  @Post('product-variants/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductVariantImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMediaFile,
  ) {
    return this.adminDashboardService.uploadProductVariantImage(id, file);
  }

  @Get('offers')
  async listOffers() {
    return this.adminDashboardService.listOffers();
  }

  @Post('offers')
  async createOffer(@Body() body: CreateOfferDto) {
    return this.adminDashboardService.createOffer(body);
  }

  @Patch('offers/:id')
  async updateOffer(@Param('id') id: string, @Body() body: UpdateOfferDto) {
    return this.adminDashboardService.updateOffer(id, body);
  }
}
