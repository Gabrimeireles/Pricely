import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { type JwtUserPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptimizationResultService } from '../application/optimization-result.service';
import { OptimizeShoppingListDto } from './dto/optimize-shopping-list.dto';

@Controller('shopping-lists/:shoppingListId')
@UseGuards(JwtAuthGuard)
export class OptimizationController {
  constructor(
    private readonly optimizationResultService: OptimizationResultService,
  ) {}

  @Post('optimize')
  async optimize(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: OptimizeShoppingListDto,
  ) {
    return this.optimizationResultService.optimize(user.sub, shoppingListId, body);
  }

  @Post('optimization-runs')
  async createRun(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: OptimizeShoppingListDto,
  ) {
    return this.optimizationResultService.createOptimizationRun(
      user.sub,
      shoppingListId,
      body,
    );
  }

  @Get('optimization-runs/latest')
  async latest(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
  ) {
    return this.optimizationResultService.getLatest(user.sub, shoppingListId);
  }

  @Get('optimizations/latest')
  async legacyLatest(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
  ) {
    return this.optimizationResultService.getLatest(user.sub, shoppingListId);
  }
}
