import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { ProcessingJobsService } from './application/processing-jobs.service';

@Module({
  imports: [PrismaModule],
  providers: [ProcessingJobsService],
  exports: [ProcessingJobsService],
})
export class ProcessingModule {}
