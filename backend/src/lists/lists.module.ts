import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import {
  SharedShoppingListsController,
  ShoppingListsController,
} from './api/shopping-lists.controller';
import { ShoppingListsService } from './application/shopping-lists.service';
import { ShoppingListRepository } from './infrastructure/shopping-list.repository';

@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [ShoppingListsController, SharedShoppingListsController],
  providers: [ShoppingListsService, ShoppingListRepository],
  exports: [ShoppingListsService, ShoppingListRepository],
})
export class ListsModule {}
