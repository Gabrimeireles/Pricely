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
    @Query('latitude') latitudeRaw?: string,
    @Query('longitude') longitudeRaw?: string,
    @Query('coverageRadiusKm') coverageRadiusKmRaw?: string,
  ) {
    const latitude = latitudeRaw !== undefined ? parseFloat(latitudeRaw) : undefined;
    const longitude = longitudeRaw !== undefined ? parseFloat(longitudeRaw) : undefined;
    const coverageRadiusKm = coverageRadiusKmRaw !== undefined ? parseFloat(coverageRadiusKmRaw) : undefined;

    return this.publicPricingService.listRegionOffers(regionSlug, {
      query,
      store,
      category,
      confidence,
      sort,
      page,
      pageSize,
      latitude: isNaN(latitude!) ? undefined : latitude,
      longitude: isNaN(longitude!) ? undefined : longitude,
      coverageRadiusKm: isNaN(coverageRadiusKm!) ? undefined : coverageRadiusKm,
    });
  }

  @Get('offers/:offerId')
  async getOfferDetail(@Param('offerId') offerId: string) {
    return this.publicPricingService.getOfferDetail(offerId);
  }
}
