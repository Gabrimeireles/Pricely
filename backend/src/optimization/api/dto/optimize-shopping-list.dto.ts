import { IsEnum, IsOptional, IsString } from 'class-validator';

import { type OptimizeShoppingListRequest, type OptimizationMode } from '../../../common/contracts';

export class OptimizeShoppingListDto implements OptimizeShoppingListRequest {
  @IsEnum(['local', 'global_unique', 'global_full'])
  mode!: OptimizationMode;

  @IsOptional()
  @IsString()
  preferredEstablishmentId?: string;

  @IsOptional()
  @IsString()
  regionId?: string;
}
