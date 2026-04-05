import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ShoppingListsService } from '../application/shopping-lists.service';
import { AddShoppingListItemsDto } from './dto/add-shopping-list-items.dto';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';

@Controller('shopping-lists')
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Post()
  async create(@Body() body: CreateShoppingListDto) {
    return this.shoppingListsService.create(body);
  }

  @Get()
  async list() {
    return this.shoppingListsService.list();
  }

  @Post(':shoppingListId/items')
  async addItems(
    @Param('shoppingListId') shoppingListId: string,
    @Body() body: AddShoppingListItemsDto,
  ) {
    return this.shoppingListsService.addItems(shoppingListId, body.items);
  }
}
