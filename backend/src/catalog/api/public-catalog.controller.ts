import { Controller, Get, Param, Query } from '@nestjs/common';

import { PublicCatalogService } from '../application/public-catalog.service';

@Controller('catalog-products')
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    return this.publicCatalogService.searchCatalogProducts(query ?? '');
  }

  @Get(':catalogProductId/variants')
  async listVariants(@Param('catalogProductId') catalogProductId: string) {
    return this.publicCatalogService.listVariants(catalogProductId);
  }

  @Get(':catalogProductId')
  async getDetail(@Param('catalogProductId') catalogProductId: string) {
    return this.publicCatalogService.getCatalogProductDetail(catalogProductId);
  }
}
