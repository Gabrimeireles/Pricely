import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicPricingService } from './application/public-pricing.service';
import { PublicSearchMetricsService } from './application/public-search-metrics.service';
import { PublicPricingController } from './api/public-pricing.controller';
import { OfferManagementService } from './application/offer-management.service';

@Module({
  imports: [PrismaModule],
  providers: [
    PublicPricingService,
    PublicSearchMetricsService,
    OfferManagementService,
  ],
  controllers: [PublicPricingController],
  exports: [
    PublicPricingService,
    PublicSearchMetricsService,
    OfferManagementService,
  ],
})
export class PricingModule {}
