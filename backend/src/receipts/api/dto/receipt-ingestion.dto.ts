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
  @IsString()
  ean?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @IsNumber()
  @Min(0.0001)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  originalUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  promotionalUnitPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  packageSize?: string;
}

class ReceiptUploadedFileMetadataDto {
  @IsString()
  storageKey!: string;

  @IsOptional()
  @IsString()
  originalFilename?: string;

  @IsIn(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
  mimeType!: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

  @IsNumber()
  @Min(1)
  sizeBytes!: number;
}

export class ReceiptIngestionDto implements ReceiptIngestionRequest {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeCnpj?: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsIn([
    'manual_entry',
    'qr_code_url',
    'qr_code_image',
    'pdf_upload',
    'image_parse',
    'structured_provider',
  ])
  sourceType?:
    | 'manual_entry'
    | 'qr_code_url'
    | 'qr_code_image'
    | 'pdf_upload'
    | 'image_parse'
    | 'structured_provider';

  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @IsOptional()
  @IsString()
  accessKey?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReceiptUploadedFileMetadataDto)
  uploadedFile?: ReceiptUploadedFileMetadataDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineItemInputDto)
  items?: ReceiptLineItemInputDto[];
}
