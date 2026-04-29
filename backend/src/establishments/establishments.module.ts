import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { EstablishmentsService } from './application/establishments.service';

@Module({
  imports: [PrismaModule],
  providers: [EstablishmentsService],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
