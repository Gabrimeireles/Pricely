import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { type ShoppingListItemInput } from '../../../common/contracts';

class ShoppingListItemInputDto implements ShoppingListItemInput {
  @IsString()
  requestedName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  preferredBrand?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddShoppingListItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShoppingListItemInputDto)
  items!: ShoppingListItemInputDto[];
}
