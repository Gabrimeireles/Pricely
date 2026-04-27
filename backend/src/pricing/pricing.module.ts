import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicPricingService } from './application/public-pricing.service';
import { PublicPricingController } from './api/public-pricing.controller';

@Module({
  imports: [PrismaModule],
  providers: [PublicPricingService],
  controllers: [PublicPricingController],
  exports: [PublicPricingService],
})
export class PricingModule {}
