import { IsEnum, IsOptional, IsString } from 'class-validator';

import { type OptimizeShoppingListRequest, type OptimizationMode } from '../../../common/contracts';

export class OptimizeShoppingListDto implements OptimizeShoppingListRequest {
  @IsEnum(['multi_market', 'local_market', 'global_store'])
  mode!: OptimizationMode;

  @IsOptional()
  @IsString()
  preferredStoreId?: string;

  @IsOptional()
  @IsString()
  locationHint?: string;
}
