import { IsString, MinLength } from 'class-validator';

export class UpdatePreferredRegionDto {
  @IsString()
  @MinLength(2)
  regionSlug!: string;
}
