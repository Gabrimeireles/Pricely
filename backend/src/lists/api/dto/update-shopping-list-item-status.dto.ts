import { IsIn } from 'class-validator';

export class UpdateShoppingListItemStatusDto {
  @IsIn(['pending', 'purchased'])
  purchaseStatus!: 'pending' | 'purchased';
}
