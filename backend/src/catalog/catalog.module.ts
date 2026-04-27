import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicCatalogController } from './api/public-catalog.controller';
import { ProductMatchRepository } from './infrastructure/product-match.repository';
import { ProductMatchService } from './application/product-match.service';
import { ProductNormalizerService } from './application/product-normalizer.service';
import { PublicCatalogService } from './application/public-catalog.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ProductNormalizerService,
    ProductMatchRepository,
    ProductMatchService,
    PublicCatalogService,
  ],
  controllers: [PublicCatalogController],
  exports: [
    ProductNormalizerService,
    ProductMatchService,
    ProductMatchRepository,
    PublicCatalogService,
  ],
})
export class CatalogModule {}
