import { IsEnum, IsOptional, IsString } from 'class-validator';

import { type CreateShoppingListRequest, type OptimizationMode } from '../../../common/contracts';

export class CreateShoppingListDto implements CreateShoppingListRequest {
  @IsString()
  name!: string;

  @IsEnum(['multi_market', 'local_market', 'global_store'])
  mode!: OptimizationMode;

  @IsOptional()
  @IsString()
  preferredStoreId?: string;

  @IsOptional()
  @IsString()
  locationHint?: string;
}
