import { Module } from '@nestjs/common';

import { CatalogModule } from '../catalog/catalog.module';
import { StoreOfferRepository } from './infrastructure/store-offer.repository';

@Module({
  imports: [CatalogModule],
  providers: [StoreOfferRepository],
  exports: [StoreOfferRepository],
})
export class StoresModule {}
