import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ReceiptQrScannerScreen extends StatefulWidget {
  const ReceiptQrScannerScreen({super.key});

  @override
  State<ReceiptQrScannerScreen> createState() => _ReceiptQrScannerScreenState();
}

class _ReceiptQrScannerScreenState extends State<ReceiptQrScannerScreen> {
  bool _handled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ler QR Code da NFC-e')),
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          MobileScanner(
            onDetect: (capture) {
              if (_handled) {
                return;
              }
              for (final barcode in capture.barcodes) {
                final value = barcode.rawValue?.trim();
                if (value == null || !isValidReceiptQrUrl(value)) {
                  continue;
                }
                _handled = true;
                Navigator.of(context).pop(value);
                return;
              }
            },
          ),
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFB5FF56), width: 3),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              minimum: const EdgeInsets.all(20),
              child: Material(
                color: Theme.of(context)
                    .colorScheme
                    .inverseSurface
                    .withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Centralize o QR Code da NFC-e. A leitura e enviada somente depois da sua confirmacao.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onInverseSurface,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

bool isValidReceiptQrUrl(String value) {
  final uri = Uri.tryParse(value.trim());
  if (uri == null || !uri.hasAuthority) {
    return false;
  }
  return uri.scheme == 'https' || uri.scheme == 'http';
}
