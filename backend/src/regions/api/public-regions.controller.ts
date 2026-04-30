import { Controller, Get } from '@nestjs/common';

import { PublicRegionsService } from '../application/public-regions.service';

@Controller('regions')
export class PublicRegionsController {
  constructor(private readonly publicRegionsService: PublicRegionsService) {}

  @Get()
  async list() {
    return this.publicRegionsService.listVisibleRegions();
  }

  @Get('impact')
  async impact() {
    return this.publicRegionsService.getPublicImpact();
  }
}
