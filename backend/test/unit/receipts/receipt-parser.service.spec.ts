import { ProductNormalizerService } from '../../../src/catalog/application/product-normalizer.service';
import {
  ReceiptIngestionRequest,
} from '../../../src/common/contracts/receipt.contract';
import { ReceiptParserService } from '../../../src/receipts/application/receipt-parser.service';

describe('ReceiptParserService', () => {
  const productNormalizerService = new ProductNormalizerService();
  const service = new ReceiptParserService(productNormalizerService);

  it('parses valid receipt items into structured data with normalized names', () => {
    const input: ReceiptIngestionRequest = {
      storeName: ' Atacadao ',
      purchaseDate: '2026-04-05',
      items: [
        {
          rawProductName: 'Arroz Tio João tp1 5kg',
          quantity: 2,
          unitPrice: 29.9,
        },
      ],
    };

    const result = service.parse(input);

    expect(result.parseStatus).toBe('parsed');
    expect(result.storeName).toBe('Atacadao');
    expect(result.issues).toEqual([]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      rawProductName: 'Arroz Tio João tp1 5kg',
      normalizedName: 'arroz tio joao tipo 1',
      quantity: 2,
      unitPrice: 29.9,
      currency: 'BRL',
      packageSize: '5 kg',
      lineTotal: 59.8,
    });
  });

  it('defaults invalid quantities, skips broken lines, and marks the parse as partial', () => {
    const input: ReceiptIngestionRequest = {
      storeName: 'Carrefour',
      items: [
        {
          rawProductName: 'Leite Int. Italac 1L',
          quantity: 0,
          unitPrice: 6.49,
        },
        {
          rawProductName: 'Item sem preco',
          unitPrice: 0,
        },
      ],
    };

    const result = service.parse(input);

    expect(result.parseStatus).toBe('partial');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      normalizedName: 'leite integral italac',
      quantity: 1,
      packageSize: '1 l',
      lineTotal: 6.49,
    });
    expect(result.issues).toContain('item_0_quantity_defaulted');
    expect(result.issues).toContain('item_1_invalid_unit_price');
    expect(result.confidenceScore).toBeLessThan(0.95);
  });

  it('fails when no valid structured lines can be extracted', () => {
    const input: ReceiptIngestionRequest = {
      storeName: '   ',
      items: [
        {
          rawProductName: '   ',
          unitPrice: 12,
        },
      ],
    };

    const result = service.parse(input);

    expect(result.parseStatus).toBe('failed');
    expect(result.items).toEqual([]);
    expect(result.issues).toContain('missing_store_name');
    expect(result.issues).toContain('item_0_missing_name');
    expect(result.confidenceScore).toBe(0);
  });
});
