import { Module } from '@nestjs/common';

import { ProductNormalizerService } from './application/product-normalizer.service';

@Module({
  providers: [ProductNormalizerService],
  exports: [ProductNormalizerService],
})
export class CatalogModule {}
