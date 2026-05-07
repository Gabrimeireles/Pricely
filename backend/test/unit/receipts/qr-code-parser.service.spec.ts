import { QrCodeParserService } from '../../../src/receipts/application/qr-code-parser.service';

describe('QrCodeParserService', () => {
  const service = new QrCodeParserService();

  it('extracts the NFC-e access key and SEFAZ URL from QR Code content', () => {
    const result = service.parse(
      'https://www.sefaz.example.gov.br/nfce/qrcode?p=12345678901234567890123456789012345678901234|2|1',
    );

    expect(result).toEqual({
      accessKey: '12345678901234567890123456789012345678901234',
      sefazUrl:
        'https://www.sefaz.example.gov.br/nfce/qrcode?p=12345678901234567890123456789012345678901234|2|1',
    });
  });
});
