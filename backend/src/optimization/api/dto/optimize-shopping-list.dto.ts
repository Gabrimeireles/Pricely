import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  locationPreferenceId?: string;

  @IsOptional()
  @IsString()
  userLocationPreferenceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  coverageRadiusKm?: number;
}
