import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { CatalogMediaController } from './api/catalog-media.controller';
import { CatalogMediaService } from './application/catalog-media.service';
import { PublicCatalogController } from './api/public-catalog.controller';
import { ProductMatchRepository } from './infrastructure/product-match.repository';
import { ProductMatchService } from './application/product-match.service';
import { ProductNormalizerService } from './application/product-normalizer.service';
import { PublicCatalogService } from './application/public-catalog.service';
import { CatalogProductsService } from './application/catalog-products.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ProductNormalizerService,
    ProductMatchRepository,
    ProductMatchService,
    PublicCatalogService,
    CatalogProductsService,
    CatalogMediaService,
  ],
  controllers: [PublicCatalogController, CatalogMediaController],
  exports: [
    ProductNormalizerService,
    ProductMatchService,
    ProductMatchRepository,
    PublicCatalogService,
    CatalogProductsService,
    CatalogMediaService,
  ],
})
export class CatalogModule {}
