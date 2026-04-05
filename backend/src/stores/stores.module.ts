import { Module } from '@nestjs/common';

import { StoreOfferRepository } from './infrastructure/store-offer.repository';

@Module({
  providers: [StoreOfferRepository],
  exports: [StoreOfferRepository],
})
export class StoresModule {}
