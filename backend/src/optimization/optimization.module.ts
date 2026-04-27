import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ListsModule } from '../lists/lists.module';
import { ProcessingModule } from '../processing/processing.module';
import { StoresModule } from '../stores/stores.module';
import { OptimizationController } from './api/optimization.controller';
import { OptimizationResultService } from './application/optimization-result.service';
import { MultiMarketOptimizerService } from './domain/multi-market-optimizer.service';

@Module({
  imports: [AuthModule, ListsModule, StoresModule, ProcessingModule],
  controllers: [OptimizationController],
  providers: [
    MultiMarketOptimizerService,
    OptimizationResultService,
  ],
  exports: [OptimizationResultService, MultiMarketOptimizerService],
})
export class OptimizationModule {}
