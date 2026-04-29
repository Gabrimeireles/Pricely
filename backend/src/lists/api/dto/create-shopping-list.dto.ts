import { IsIn, IsOptional, IsString } from 'class-validator';

import { type CreateShoppingListRequest, type OptimizationMode } from '../../../common/contracts';

export class CreateShoppingListDto implements CreateShoppingListRequest {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  preferredRegionId?: string;

  @IsOptional()
  @IsIn(['local', 'global_unique', 'global_full'])
  lastMode?: OptimizationMode;
}
