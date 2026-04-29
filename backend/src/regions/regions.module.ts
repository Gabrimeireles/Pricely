import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicRegionsService } from './application/public-regions.service';
import { PublicRegionsController } from './api/public-regions.controller';
import { RegionsAdminService } from './application/regions-admin.service';

@Module({
  imports: [PrismaModule],
  providers: [PublicRegionsService, RegionsAdminService],
  controllers: [PublicRegionsController],
  exports: [PublicRegionsService, RegionsAdminService],
})
export class RegionsModule {}
