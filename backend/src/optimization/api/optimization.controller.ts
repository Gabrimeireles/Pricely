import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { OptimizationResultService } from '../application/optimization-result.service';
import { OptimizeShoppingListDto } from './dto/optimize-shopping-list.dto';

@Controller('shopping-lists/:shoppingListId')
export class OptimizationController {
  constructor(
    private readonly optimizationResultService: OptimizationResultService,
  ) {}

  @Post('optimize')
  async optimize(
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: OptimizeShoppingListDto,
  ) {
    return this.optimizationResultService.optimize(shoppingListId, body);
  }

  @Get('optimizations/latest')
  async latest(@Param('shoppingListId') shoppingListId: string) {
    return this.optimizationResultService.getLatest(shoppingListId);
  }
}
