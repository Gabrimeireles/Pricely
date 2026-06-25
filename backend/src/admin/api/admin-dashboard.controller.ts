import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PublicSearchMetricsService } from '../../pricing/application/public-search-metrics.service';
import { ProcessingJobsService } from '../../processing/application/processing-jobs.service';
import { MissingProductRequestsService } from '../../catalog/application/missing-product-requests.service';
import { AdminDashboardService } from '../application/admin-dashboard.service';

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

function transformBrazilianMoney({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\s+/g, '');

  if (!normalized) {
    return undefined;
  }

  const numericValue =
    normalized.includes(',') &&
    normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  const parsed = Number(numericValue);

  return Number.isFinite(parsed) ? parsed : value;
}

type AuthenticatedAdminRequest = {
  user: {
    id: string;
  };
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

  @IsOptional()
  @IsString()
  cityName?: string;

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

  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  priceAmount!: number;

  @IsOptional()
  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  basePriceAmount?: number;

  @IsOptional()
  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  promotionalPriceAmount?: number;

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
  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  basePriceAmount?: number;

  @IsOptional()
  @Transform(transformBrazilianMoney)
  @IsNumber()
  @Min(0)
  promotionalPriceAmount?: number;

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

class UpdateUserPremiumDto {
  @IsBoolean()
  enabled!: boolean;
}

class GrantUserTokensDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

class RejectReceiptDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class CancelProcessingJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

class ConvertMissingProductRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  defaultUnit?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class RejectMissingProductRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
    private readonly publicSearchMetrics: PublicSearchMetricsService,
    private readonly processingJobsService: ProcessingJobsService,
    private readonly missingProductRequestsService: MissingProductRequestsService,
  ) {}

  @Get('metrics')
  async metrics() {
    return this.adminDashboardService.getMetrics();
  }

  @Get('metrics/public-search')
  async publicSearchMetricsSnapshot() {
    return this.publicSearchMetrics.getSnapshot();
  }

  @Get('processing-jobs')
  async listProcessingJobs() {
    return this.adminDashboardService.listProcessingJobs();
  }

  @Get('processing-jobs/:id')
  async getProcessingJobDetail(@Param('id') id: string) {
    return this.adminDashboardService.getProcessingJobDetail(id);
  }

  @Post('processing-jobs/:id/retry')
  retryProcessingJob(@Param('id') id: string) {
    return this.processingJobsService.retry(id);
  }

  @Post('processing-jobs/:id/review')
  reviewProcessingJob(
    @Param('id') id: string,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.processingJobsService.markReviewed(id, request.user.id);
  }

  @Post('processing-jobs/:id/cancel')
  cancelProcessingJob(
    @Param('id') id: string,
    @Body() body: CancelProcessingJobDto,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.processingJobsService.cancel(id, request.user.id, body.reason);
  }

  @Get('missing-product-requests')
  listMissingProductRequests() {
    return this.missingProductRequestsService.listForAdmin();
  }

  @Post('missing-product-requests/:id/convert')
  convertMissingProductRequest(
    @Param('id') id: string,
    @Body() body: ConvertMissingProductRequestDto,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.missingProductRequestsService.convert(
      id,
      request.user.id,
      body,
    );
  }

  @Post('missing-product-requests/:id/reject')
  rejectMissingProductRequest(
    @Param('id') id: string,
    @Body() body: RejectMissingProductRequestDto,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.missingProductRequestsService.reject(
      id,
      request.user.id,
      body.notes,
    );
  }

  @Get('receipt-processing')
  async listReceiptProcessingReviews() {
    return this.adminDashboardService.listReceiptProcessingReviews();
  }

  @Get('receipt-processing/:id')
  async getReceiptProcessingReview(@Param('id') id: string) {
    return this.adminDashboardService.getReceiptProcessingReview(id);
  }

  @Post('receipt-processing/:id/release')
  async releaseReceiptForProcessing(@Param('id') id: string) {
    return this.adminDashboardService.releaseReceiptForProcessing(id);
  }

  @Post('receipt-processing/:id/reprocess')
  async reprocessReceipt(@Param('id') id: string) {
    return this.adminDashboardService.reprocessReceipt(id);
  }

  @Post('receipt-processing/:id/reject')
  async rejectReceipt(@Param('id') id: string, @Body() body: RejectReceiptDto) {
    return this.adminDashboardService.rejectReceipt(id, body.reason);
  }

  @Get('queue-health')
  async queueHealth() {
    return this.adminDashboardService.getQueueHealth();
  }

  @Get('shopping-lists')
  async listShoppingListAudits() {
    return this.adminDashboardService.listShoppingListAudits();
  }

  @Get('users')
  async listUsers() {
    return this.adminDashboardService.listUsers();
  }

  @Patch('users/:id/premium')
  async setUserPremium(
    @Param('id') id: string,
    @Body() body: UpdateUserPremiumDto,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.adminDashboardService.setUserPremium(id, body, request.user.id);
  }

  @Post('users/:id/tokens')
  async grantUserTokens(
    @Param('id') id: string,
    @Body() body: GrantUserTokensDto,
    @Req() request: AuthenticatedAdminRequest,
  ) {
    return this.adminDashboardService.grantUserOptimizationTokens(
      id,
      body,
      request.user.id,
    );
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

  @Delete('catalog-products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminDashboardService.deleteProduct(id);
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

  @Delete('product-variants/:id')
  async deleteProductVariant(@Param('id') id: string) {
    return this.adminDashboardService.deleteProductVariant(id);
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
