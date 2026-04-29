import { Injectable } from '@nestjs/common';

import {
  ReceiptIngestionRequest,
  ReceiptLineItemInput,
} from '../../common/contracts/receipt.contract';
import { ProductNormalizerService } from '../../catalog/application/product-normalizer.service';

export interface ParsedReceiptLineItem {
  rawProductName: string;
  normalizedName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  packageSize?: string;
  lineTotal: number;
  matchConfidence: number;
}

export interface ParsedReceipt {
  storeName: string;
  purchaseDate?: string;
  parseStatus: 'parsed' | 'partial' | 'failed';
  confidenceScore: number;
  items: ParsedReceiptLineItem[];
  issues: string[];
}

@Injectable()
export class ReceiptParserService {
  constructor(
    private readonly productNormalizerService: ProductNormalizerService,
  ) {}

  parse(request: ReceiptIngestionRequest): ParsedReceipt {
    const issues: string[] = [];
    const storeName = request.storeName.trim();

    if (!storeName) {
      issues.push('missing_store_name');
    }

    const items = request.items
      .map((item, index) => this.parseItem(item, index, issues))
      .filter((item): item is ParsedReceiptLineItem => item !== null);

    const parseStatus =
      items.length === 0 ? 'failed' : issues.length > 0 ? 'partial' : 'parsed';

    return {
      storeName,
      purchaseDate: request.purchaseDate,
      parseStatus,
      confidenceScore: this.calculateConfidenceScore(items.length, issues.length),
      items,
      issues,
    };
  }

  private parseItem(
    item: ReceiptLineItemInput,
    index: number,
    issues: string[],
  ): ParsedReceiptLineItem | null {
    const rawProductName = item.rawProductName.trim().replace(/\s+/g, ' ');

    if (!rawProductName) {
      issues.push(`item_${index}_missing_name`);
      return null;
    }

    if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
      issues.push(`item_${index}_invalid_unit_price`);
      return null;
    }

    const quantity =
      item.quantity && Number.isFinite(item.quantity) && item.quantity > 0
        ? item.quantity
        : 1;

    if (quantity === 1 && item.quantity !== undefined && item.quantity !== 1) {
      issues.push(`item_${index}_quantity_defaulted`);
    }

    const normalized = this.productNormalizerService.normalize(rawProductName);
    const currency = item.currency?.trim() || 'BRL';

    return {
      rawProductName,
      normalizedName: normalized.canonicalName,
      quantity,
      unitPrice: item.unitPrice,
      currency,
      packageSize: item.packageSize ?? normalized.sizeDescriptor,
      lineTotal: Number((quantity * item.unitPrice).toFixed(2)),
      matchConfidence: normalized.confidenceScore,
    };
  }

  private calculateConfidenceScore(
    validItems: number,
    issueCount: number,
  ): number {
    if (validItems === 0) {
      return 0;
    }

    const base = 0.95;
    const penalty = issueCount * 0.1;

    return Math.max(0, Number((base - penalty).toFixed(2)));
  }
}
