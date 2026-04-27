import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { PublicRegionsService } from './application/public-regions.service';
import { PublicRegionsController } from './api/public-regions.controller';

@Module({
  imports: [PrismaModule],
  providers: [PublicRegionsService],
  controllers: [PublicRegionsController],
  exports: [PublicRegionsService],
})
export class RegionsModule {}
