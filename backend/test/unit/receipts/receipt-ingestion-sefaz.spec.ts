import { ProductNormalizerService } from '../../../src/catalog/application/product-normalizer.service';
import { ReceiptIngestionService } from '../../../src/receipts/application/receipt-ingestion.service';
import { QrCodeParserService } from '../../../src/receipts/application/qr-code-parser.service';
import { ReceiptContributionQualityService } from '../../../src/receipts/application/receipt-contribution-quality.service';
import { ReceiptParserService } from '../../../src/receipts/application/receipt-parser.service';
import { ReceiptSanitizerService } from '../../../src/receipts/application/receipt-sanitizer.service';

function createService() {
  return new ReceiptIngestionService(
    new ReceiptParserService(new ProductNormalizerService()),
    new ReceiptSanitizerService(),
    new QrCodeParserService(),
    {} as ReceiptContributionQualityService,
    { resolve: jest.fn() } as never,
    {} as never,
    {} as never,
    { add: jest.fn() } as never,
  );
}

describe('ReceiptIngestionService SEFAZ HTML extraction', () => {
  it('extracts MG NFC-e store, CNPJ, purchase date and line items without asking the user to type them', () => {
    const service = createService() as unknown as {
      parseSefazHtml(html: string): {
        storeName?: string;
        storeCnpj?: string;
        purchaseDate?: string;
        items?: Array<{
          rawProductName: string;
          ean?: string;
          quantity: number;
          unitPrice: number;
          originalUnitPrice?: number;
          packageSize?: string;
        }>;
      };
    };
    const html = `
      <html>
        <body>
          Nota Fiscal de Consumidor Eletrônica (NFC-e) SUPERMERCADO TESTE LTDA
          CNPJ: 04641376024400 - Inscrição Estadual: 0032546124242
          AV. LEITE DE CASTRO, 261, FABRICAS, 3162500 - SAO JOAO DEL REI, MG
          Data Emissão 15/05/2026 20:36:48
          <table>
            <tr><td><h7>CAFE PILAO TRAD 500G</h7> (Código: 60349)</td><td>Qtde total de ítens: 1.000</td><td>UN: PT</td><td>Valor total R$: R$ 25,80</td></tr>
            <tr><td><h7>REQ CR VIGOR LIG 200</h7> (Código: 202640)</td><td>Qtde total de ítens: 2.000</td><td>UN: PO</td><td>Valor total R$: R$ 17,96</td></tr>
          </table>
        </body>
      </html>
    `;

    expect(service.parseSefazHtml(html)).toEqual(
      expect.objectContaining({
        storeName: 'SUPERMERCADO TESTE LTDA',
        storeCnpj: '04641376024400',
        purchaseDate: '2026-05-15T20:36:48-03:00',
        items: [
          expect.objectContaining({
            rawProductName: 'CAFE PILAO TRAD 500G',
            ean: '60349',
            quantity: 1,
            unitPrice: 25.8,
            originalUnitPrice: 25.8,
            packageSize: '500 g',
          }),
          expect.objectContaining({
            rawProductName: 'REQ CR VIGOR LIG 200',
            ean: '202640',
            quantity: 2,
            unitPrice: 8.98,
            originalUnitPrice: 8.98,
          }),
        ],
      }),
    );
  });

  it('parses properly encoded SEFAZ HTML from a real NFC-e page', () => {
    const service = createService() as unknown as {
      parseSefazHtml(html: string): {
        storeName?: string;
        storeCnpj?: string;
        purchaseDate?: string;
        items?: Array<{
          rawProductName: string;
          ean?: string;
          quantity: number;
          unitPrice: number;
          originalUnitPrice?: number;
          packageSize?: string;
        }>;
      };
    };
    const html = `
      <html>
        <body>
          Nota Fiscal de Consumidor Eletrônica (NFC-e) SUPERMERCADO SALES LTDA
          CNPJ: 04641376024400 -, Inscrição Estadual: 0032546124242
          AV. LEITE DE CASTRO, 261, FABRICAS, 3162500 - SAO JOAO DEL REI, MG
          Data Emissão 15/05/2026 20:36:48
          <table>
            <tr><td><h7>BISC PIRAQUE 80G</h7> (Código: 2981734)</td><td>Qtde total de ítens: 1.000</td><td>UN: PT</td><td>Valor total R$: R$ 3,48</td></tr>
            <tr><td><h7>CAFE SOL 3 COR 100G</h7> (Código: 1796254)</td><td>Qtde total de ítens: 1.000</td><td>UN: VD</td><td>Valor total R$: R$ 34,90</td></tr>
          </table>
        </body>
      </html>
    `;

    expect(service.parseSefazHtml(html)).toEqual(
      expect.objectContaining({
        storeName: 'SUPERMERCADO SALES LTDA',
        storeCnpj: '04641376024400',
        purchaseDate: '2026-05-15T20:36:48-03:00',
        items: [
          expect.objectContaining({
            rawProductName: 'BISC PIRAQUE 80G',
            ean: '2981734',
            quantity: 1,
            unitPrice: 3.48,
            originalUnitPrice: 3.48,
            packageSize: '80 g',
          }),
          expect.objectContaining({
            rawProductName: 'CAFE SOL 3 COR 100G',
            ean: '1796254',
            quantity: 1,
            unitPrice: 34.9,
            packageSize: '100 g',
          }),
        ],
      }),
    );
  });

  it('parses SEFAZ HTML that uses named and numeric HTML entities', () => {
    const service = createService() as unknown as {
      parseSefazHtml(html: string): {
        storeName?: string;
        storeCnpj?: string;
        purchaseDate?: string;
        items?: Array<{
          rawProductName: string;
          ean?: string;
          quantity: number;
          unitPrice: number;
        }>;
      };
    };
    const html = `
      <html>
        <body>
          Nota Fiscal de Consumidor Eletr&ocirc;nica (NFC-e) SUPERMERCADO ENTITY LTDA
          CNPJ: 04641376024400 -, Inscri&ccedil;&atilde;o Estadual: 0032546124242
          Data Emiss&#227;o 15/05/2026 20:36:48
          <table>
            <tr><td><h7>REFR C COLA S/AC 200</h7> (C&oacute;digo: 1462210)</td><td>Qtde total de &iacute;tens: 3.000</td><td>UN: FR</td><td>Valor total R$: R$ 5,94</td></tr>
          </table>
        </body>
      </html>
    `;

    expect(service.parseSefazHtml(html)).toEqual(
      expect.objectContaining({
        storeName: 'SUPERMERCADO ENTITY LTDA',
        storeCnpj: '04641376024400',
        purchaseDate: '2026-05-15T20:36:48-03:00',
        items: [
          expect.objectContaining({
            rawProductName: 'REFR C COLA S/AC 200',
            ean: '1462210',
            quantity: 3,
            unitPrice: 1.98,
          }),
        ],
      }),
    );
  });
});
