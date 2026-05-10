import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { LocationsController } from './api/locations.controller';
import { LocationsService } from './application/locations.service';

@Module({
  imports: [PrismaModule],
  providers: [LocationsService],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
