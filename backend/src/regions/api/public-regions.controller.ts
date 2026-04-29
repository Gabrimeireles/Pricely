import { Controller, Get } from '@nestjs/common';

import { PublicRegionsService } from '../application/public-regions.service';

@Controller('regions')
export class PublicRegionsController {
  constructor(private readonly publicRegionsService: PublicRegionsService) {}

  @Get()
  async list() {
    return this.publicRegionsService.listVisibleRegions();
  }
}
