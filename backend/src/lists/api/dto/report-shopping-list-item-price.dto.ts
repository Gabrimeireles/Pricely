import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ReportShoppingListItemPriceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reportedPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
