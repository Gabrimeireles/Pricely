import {
  IsArray,
  IsIn,
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
  @IsString()
  catalogProductId?: string;

  @IsOptional()
  @IsString()
  lockedProductVariantId?: string;

  @IsOptional()
  @IsString()
  brandPreferenceMode?: 'any' | 'preferred' | 'exact';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrandNames?: string[];

  @IsOptional()
  @IsIn(['pending', 'purchased'])
  purchaseStatus?: 'pending' | 'purchased';

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @IsOptional()
  @IsString()
  unitLabel?: string;

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
