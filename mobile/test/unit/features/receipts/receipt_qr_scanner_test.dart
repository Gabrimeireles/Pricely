import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/features/receipts/presentation/receipt_qr_scanner_screen.dart';

void main() {
  test('accepts web URLs and rejects unsafe QR payloads', () {
    expect(
      isValidReceiptQrUrl('https://www.fazenda.sp.gov.br/qrcode?p=123'),
      isTrue,
    );
    expect(isValidReceiptQrUrl('http://localhost/nfce'), isTrue);
    expect(isValidReceiptQrUrl('javascript:alert(1)'), isFalse);
    expect(isValidReceiptQrUrl('not-a-url'), isFalse);
  });
}
