import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ListsModule } from '../lists/lists.module';
import { ProcessingModule } from '../processing/processing.module';
import { StoresModule } from '../stores/stores.module';
import { UsersModule } from '../users/users.module';
import { OptimizationController } from './api/optimization.controller';
import { OptimizationResultService } from './application/optimization-result.service';
import { MultiMarketOptimizerService } from './domain/multi-market-optimizer.service';
import { OptimizationRunRepository } from './infrastructure/optimization-run.repository';

@Module({
  imports: [AuthModule, ListsModule, StoresModule, ProcessingModule, UsersModule],
  controllers: [OptimizationController],
  providers: [
    MultiMarketOptimizerService,
    OptimizationResultService,
    OptimizationRunRepository,
  ],
  exports: [
    OptimizationResultService,
    MultiMarketOptimizerService,
    OptimizationRunRepository,
  ],
})
export class OptimizationModule {}
