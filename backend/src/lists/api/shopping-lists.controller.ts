import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { type JwtUserPayload } from '../../auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ShoppingListsService } from '../application/shopping-lists.service';
import { AddShoppingListItemsDto } from './dto/add-shopping-list-items.dto';
import { CompleteShoppingListDto } from './dto/complete-shopping-list.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { ReportShoppingListItemPriceDto } from './dto/report-shopping-list-item-price.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { UpdateShoppingListItemStatusDto } from './dto/update-shopping-list-item-status.dto';

@Controller('shopping-lists')
@UseGuards(JwtAuthGuard)
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateShoppingListDto,
  ) {
    return this.shoppingListsService.create(user.sub, body);
  }

  @Get()
  async list(@CurrentUser() user: JwtUserPayload) {
    return this.shoppingListsService.list(user.sub);
  }

  @Get(':shoppingListId')
  async getById(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
  ) {
    return this.shoppingListsService.getById(user.sub, shoppingListId);
  }

  @Patch(':shoppingListId')
  async replace(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: UpdateShoppingListDto,
  ) {
    return this.shoppingListsService.replace(user.sub, shoppingListId, {
      name: body.name,
      preferredRegionId: body.preferredRegionId,
      lastMode: body.lastMode,
      items: body.items ?? [],
    });
  }

  @Post(':shoppingListId/items')
  async addItems(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: AddShoppingListItemsDto,
  ) {
    return this.shoppingListsService.addItems(user.sub, shoppingListId, body.items);
  }

  @Patch(':shoppingListId/items/:itemId/purchase-status')
  async updateItemPurchaseStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateShoppingListItemStatusDto,
  ) {
    return this.shoppingListsService.updateItemPurchaseStatus(
      user.sub,
      shoppingListId,
      itemId,
      body.purchaseStatus,
    );
  }

  @Post(':shoppingListId/checkout-completion')
  async completeCheckout(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: CompleteShoppingListDto,
  ) {
    return this.shoppingListsService.completeCheckout(
      user.sub,
      shoppingListId,
      body.paidTotal,
    );
  }

  @Post(':shoppingListId/items/:itemId/price-reports')
  async reportItemPriceMismatch(
    @CurrentUser() user: JwtUserPayload,
    @Param('shoppingListId') shoppingListId: string,
    @Param('itemId') itemId: string,
    @Body() body: ReportShoppingListItemPriceDto,
  ) {
    return this.shoppingListsService.reportItemPriceMismatch(
      user.sub,
      shoppingListId,
      itemId,
      {
        expectedPrice: body.expectedPrice,
        reportedPrice: body.reportedPrice,
        reason: body.reason,
      },
    );
  }
}
