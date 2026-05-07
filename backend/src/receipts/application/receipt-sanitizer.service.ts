import { Injectable } from '@nestjs/common';

import {
  type ReceiptIngestionRequest,
  type ReceiptLineItemInput,
} from '../../common/contracts/receipt.contract';

const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PERSONAL_FIELD_PATTERN =
  /\b(?:cpf|consumidor|cliente|nome|endereco|endereço|logradouro|bairro|cep)\b\s*:?\s*[^|;\n\r]*/gi;

@Injectable()
export class ReceiptSanitizerService {
  sanitizeRequest(request: ReceiptIngestionRequest): ReceiptIngestionRequest {
    return {
      ...request,
      storeName: this.cleanText(request.storeName),
      storeCnpj: this.cleanCnpj(request.storeCnpj),
      qrCodeUrl: this.cleanUrl(request.qrCodeUrl),
      accessKey: this.cleanAccessKey(request.accessKey),
      uploadedFile: request.uploadedFile
        ? {
            storageKey: this.cleanStorageKey(request.uploadedFile.storageKey),
            originalFilename: this.cleanFilename(request.uploadedFile.originalFilename),
            mimeType: request.uploadedFile.mimeType,
            sizeBytes: request.uploadedFile.sizeBytes,
          }
        : undefined,
      items: request.items?.map((item) => this.sanitizeItem(item)),
    };
  }

  cleanText(value?: string): string | undefined {
    const cleaned = value
      ?.replace(CPF_PATTERN, '')
      .replace(PERSONAL_FIELD_PATTERN, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || undefined;
  }

  cleanCnpj(value?: string): string | undefined {
    const digits = value?.replace(/\D/g, '');

    return digits?.length === 14 ? digits : undefined;
  }

  cleanAccessKey(value?: string): string | undefined {
    const digits = value?.replace(/\D/g, '');

    return digits?.length === 44 ? digits : undefined;
  }

  cleanUrl(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const url = value.replace(CPF_PATTERN, '').trim();

    return url || undefined;
  }

  private sanitizeItem(item: ReceiptLineItemInput): ReceiptLineItemInput {
    return {
      ...item,
      rawProductName: this.cleanText(item.rawProductName) ?? '',
      ean: this.cleanEan(item.ean),
      currency: this.cleanText(item.currency),
      packageSize: this.cleanText(item.packageSize),
    };
  }

  private cleanEan(value?: string): string | undefined {
    const digits = value?.replace(/\D/g, '');

    return digits && digits.length >= 8 && digits.length <= 14 ? digits : undefined;
  }

  private cleanStorageKey(value: string): string {
    return value.replace(CPF_PATTERN, '').replace(/\s+/g, ' ').trim();
  }

  private cleanFilename(value?: string): string | undefined {
    return this.cleanText(value);
  }
}
