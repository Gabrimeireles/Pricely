import { Module } from '@nestjs/common';

import { ProductMatchRepository } from './infrastructure/product-match.repository';
import { ProductMatchService } from './application/product-match.service';
import { ProductNormalizerService } from './application/product-normalizer.service';

@Module({
  providers: [
    ProductNormalizerService,
    ProductMatchRepository,
    ProductMatchService,
  ],
  exports: [ProductNormalizerService, ProductMatchService, ProductMatchRepository],
})
export class CatalogModule {}
