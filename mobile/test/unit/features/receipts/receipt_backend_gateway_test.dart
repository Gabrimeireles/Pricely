import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

void main() {
  test('submits qr code receipt to backend with manual-release feedback', () async {
    Map<String, dynamic>? capturedBody;
    String? authorizationHeader;
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          expect(request.url.path, '/receipts');
          authorizationHeader = request.headers['authorization'];
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;

          return http.Response(
            jsonEncode(<String, dynamic>{
              'id': 'rr_123',
              'storeName': 'Mercado Azul',
              'parseStatus': 'queued',
              'moderationStatus': 'pending',
              'rewardEligibilityStatus': 'eligible_pending',
              'rewardPoints': 100,
              'rewardOptimizationTokens': 1,
              'rewardMessage': 'Nota recebida: reward em processamento.',
              'reviewReason': 'waiting_manual_release',
              'processingStatus': 'waiting_manual_release',
            }),
            201,
          );
        }),
      ),
    );

    final summary = await gateway.submitReceipt(
      accessToken: 'token-123',
      storeName: 'Mercado Azul',
      qrCodeUrl: 'https://sefaz.example/qrcode?p=abc',
      rawReceipt: 'Arroz 22.90',
    );

    expect(authorizationHeader, 'Bearer token-123');
    expect(capturedBody?['sourceType'], 'qr_code_url');
    expect(capturedBody?['qrCodeUrl'], 'https://sefaz.example/qrcode?p=abc');
    expect(capturedBody?['items'], hasLength(1));
    expect(summary.id, 'rr_123');
    expect(summary.isWaitingManualRelease, isTrue);
    expect(summary.rewardEligibilityStatus, 'eligible_pending');
    expect(summary.rewardPoints, 100);
    expect(summary.rewardOptimizationTokens, 1);
  });
}
