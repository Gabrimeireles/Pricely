import { IsNumber, IsOptional, Min } from 'class-validator';

export class CompleteShoppingListDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidTotal?: number;
}
