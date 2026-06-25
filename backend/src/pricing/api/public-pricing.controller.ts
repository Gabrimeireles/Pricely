import { Controller, Get, Param, Query } from '@nestjs/common';

import { PublicPricingService } from '../application/public-pricing.service';

@Controller()
export class PublicPricingController {
  constructor(private readonly publicPricingService: PublicPricingService) {}

  @Get('regions/:regionSlug/offers')
  async listRegionOffers(
    @Param('regionSlug') regionSlug: string,
    @Query('q') query?: string,
    @Query('store') store?: string,
    @Query('category') category?: string,
    @Query('confidence') confidence?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.publicPricingService.listRegionOffers(regionSlug, {
      query,
      store,
      category,
      confidence,
      sort,
      page,
      pageSize,
    });
  }

  @Get('offers/:offerId')
  async getOfferDetail(@Param('offerId') offerId: string) {
    return this.publicPricingService.getOfferDetail(offerId);
  }
}
