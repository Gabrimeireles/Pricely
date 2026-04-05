import { Module } from '@nestjs/common';

import { ListsModule } from '../lists/lists.module';
import { StoresModule } from '../stores/stores.module';
import { OptimizationController } from './api/optimization.controller';
import { OptimizationResultService } from './application/optimization-result.service';
import { MultiMarketOptimizerService } from './domain/multi-market-optimizer.service';
import { OptimizationResultRepository } from './infrastructure/optimization-result.repository';

@Module({
  imports: [ListsModule, StoresModule],
  controllers: [OptimizationController],
  providers: [
    MultiMarketOptimizerService,
    OptimizationResultService,
    OptimizationResultRepository,
  ],
  exports: [OptimizationResultService, MultiMarketOptimizerService, OptimizationResultRepository],
})
export class OptimizationModule {}
