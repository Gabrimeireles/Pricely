import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { type ReceiptIngestionRequest } from '../../../common/contracts';

class ReceiptLineItemInputDto {
  @IsString()
  rawProductName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @IsNumber()
  @Min(0.0001)
  unitPrice!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  packageSize?: string;
}

export class ReceiptIngestionDto implements ReceiptIngestionRequest {
  @IsString()
  storeName!: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsIn(['manual_entry', 'image_parse', 'import'])
  sourceType?: 'manual_entry' | 'image_parse' | 'import';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineItemInputDto)
  items!: ReceiptLineItemInputDto[];
}
