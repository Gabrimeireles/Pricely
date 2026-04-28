import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicPricingService } from './application/public-pricing.service';
import { PublicPricingController } from './api/public-pricing.controller';
import { OfferManagementService } from './application/offer-management.service';

@Module({
  imports: [PrismaModule],
  providers: [PublicPricingService, OfferManagementService],
  controllers: [PublicPricingController],
  exports: [PublicPricingService, OfferManagementService],
})
export class PricingModule {}
