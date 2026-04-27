import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { type OptimizationMode, type ShoppingListItemInput } from '../../../common/contracts';

class UpdateShoppingListItemDto implements ShoppingListItemInput {
  @IsString()
  requestedName!: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShoppingListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  preferredRegionId?: string;

  @IsOptional()
  @IsIn(['local', 'global_unique', 'global_full'])
  lastMode?: OptimizationMode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateShoppingListItemDto)
  items?: UpdateShoppingListItemDto[];
}
