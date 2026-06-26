import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

void main() {
  test('requests location coverage preview before local optimization claims', () async {
    Map<String, dynamic>? capturedBody;
    String? authorizationHeader;
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          expect(request.url.path, '/locations/coverage-preview');
          authorizationHeader = request.headers['authorization'];
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;

          return http.Response(
            jsonEncode(<String, dynamic>{
              'regionId': 'region-1',
              'coverageRadiusKm': 5,
              'activeEstablishmentCount': 3,
              'fallbackUsed': false,
            }),
            200,
          );
        }),
      ),
    );

    final preview = await gateway.previewLocationCoverage(
      accessToken: 'token-123',
      regionId: 'region-1',
      latitude: -23.56,
      longitude: -46.65,
      coverageRadiusKm: 5,
    );

    expect(authorizationHeader, 'Bearer token-123');
    expect(capturedBody?['regionId'], 'region-1');
    expect(capturedBody?['latitude'], -23.56);
    expect(preview.activeEstablishmentCount, 3);
    expect(preview.coverageRadiusKm, 5);
  });

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

  test('registers and revokes authenticated push devices', () async {
    final requestedPaths = <String>[];
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          requestedPaths.add(request.url.path);
          expect(request.headers['authorization'], 'Bearer token-123');

          if (request.url.path == '/notification-push-devices') {
            final body = jsonDecode(request.body) as Map<String, dynamic>;
            expect(body['platform'], 'android');
            expect(body['deviceToken'], 'push-token-value-1234567890');
            expect(body['provider'], 'fcm');
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'device-1',
                'platform': 'android',
                'provider': 'fcm',
                'deviceTokenTail': 'e-1234567890',
                'isActive': true,
                'lastSeenAt': '2026-06-26T12:00:00.000Z',
              }),
              201,
            );
          }

          if (request.url.path ==
              '/notification-push-devices/device-1/revoke') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'device-1',
                'platform': 'android',
                'provider': 'fcm',
                'deviceTokenTail': 'e-1234567890',
                'isActive': false,
                'revokedAt': '2026-06-26T12:05:00.000Z',
                'lastSeenAt': '2026-06-26T12:00:00.000Z',
              }),
              201,
            );
          }

          return http.Response('not found', 404);
        }),
      ),
    );

    final registered = await gateway.registerPushDevice(
      accessToken: 'token-123',
      platform: 'android',
      deviceToken: 'push-token-value-1234567890',
    );
    final revoked = await gateway.revokePushDevice(
      accessToken: 'token-123',
      deviceId: registered.id,
    );

    expect(registered.id, 'device-1');
    expect(registered.isActive, isTrue);
    expect(revoked.isActive, isFalse);
    expect(requestedPaths, <String>[
      '/notification-push-devices',
      '/notification-push-devices/device-1/revoke',
    ]);
  });
}
