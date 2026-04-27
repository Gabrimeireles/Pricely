import { Controller, Get, Param } from '@nestjs/common';

import { PublicPricingService } from '../application/public-pricing.service';

@Controller()
export class PublicPricingController {
  constructor(private readonly publicPricingService: PublicPricingService) {}

  @Get('regions/:regionSlug/offers')
  async listRegionOffers(@Param('regionSlug') regionSlug: string) {
    return this.publicPricingService.listRegionOffers(regionSlug);
  }

  @Get('offers/:offerId')
  async getOfferDetail(@Param('offerId') offerId: string) {
    return this.publicPricingService.getOfferDetail(offerId);
  }
}
