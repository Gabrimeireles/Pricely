import { ReceiptSanitizerService } from '../../../src/receipts/application/receipt-sanitizer.service';

describe('ReceiptSanitizerService', () => {
  const service = new ReceiptSanitizerService();

  it('removes prohibited personal data before persistence', () => {
    const sanitized = service.sanitizeRequest({
      storeName: 'Mercado Legal CPF: 123.456.789-00',
      storeCnpj: '12.345.678/0001-90',
      qrCodeUrl: 'https://sefaz.example/nfce?p=12345678901234567890123456789012345678901234&cpf=12345678900',
      uploadedFile: {
        storageKey: 'receipts/user-1/123.456.789-00.pdf',
        originalFilename: 'cupom consumidor Joao 123.456.789-00.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1200,
      },
      items: [
        {
          rawProductName: 'Arroz CPF: 123.456.789-00',
          ean: '7891-0000-0000-0',
          unitPrice: 20,
        },
      ],
    });

    expect(JSON.stringify(sanitized)).not.toContain('123.456.789-00');
    expect(sanitized.storeCnpj).toBe('12345678000190');
    expect(sanitized.items?.[0]).toMatchObject({
      rawProductName: 'Arroz',
      ean: '7891000000000',
    });
  });
});
