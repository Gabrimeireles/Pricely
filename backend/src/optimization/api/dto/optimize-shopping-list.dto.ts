import { IsIn, IsOptional, IsString } from 'class-validator';

import { type OptimizationModeRequest, type OptimizeShoppingListRequest } from '../../../common/contracts';

export class OptimizeShoppingListDto implements OptimizeShoppingListRequest {
  @IsIn([
    'local',
    'global_unique',
    'global_full',
    'local_unique',
    'local_multi',
    'global_multi',
  ])
  mode!: OptimizationModeRequest;

  @IsOptional()
  @IsString()
  preferredEstablishmentId?: string;

  @IsOptional()
  @IsString()
  regionId?: string;
}
