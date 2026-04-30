import { Controller, Get, Param } from '@nestjs/common';

import { CatalogMediaService } from '../application/catalog-media.service';

@Controller('media')
export class CatalogMediaController {
  constructor(private readonly catalogMediaService: CatalogMediaService) {}

  @Get('catalog-products/:fileName')
  getCatalogProductMedia(@Param('fileName') fileName: string) {
    return this.catalogMediaService.getCatalogProductMedia(fileName);
  }

  @Get('product-variants/:fileName')
  getProductVariantMedia(@Param('fileName') fileName: string) {
    return this.catalogMediaService.getProductVariantMedia(fileName);
  }
}
