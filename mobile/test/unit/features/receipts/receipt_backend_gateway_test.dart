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
            expect(body['appVersion'], '1.2.3');
            expect(body['locale'], 'pt-BR');
            expect(body['timezone'], 'America/Sao_Paulo');
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'device-1',
                'platform': 'android',
                'provider': 'fcm',
                'deviceTokenTail': 'e-1234567890',
                'isActive': true,
                'appVersion': '1.2.3',
                'locale': 'pt-BR',
                'timezone': 'America/Sao_Paulo',
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
      appVersion: '1.2.3',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    );
    final revoked = await gateway.revokePushDevice(
      accessToken: 'token-123',
      deviceId: registered.id,
    );

    expect(registered.id, 'device-1');
    expect(registered.isActive, isTrue);
    expect(registered.timezone, 'America/Sao_Paulo');
    expect(revoked.isActive, isFalse);
    expect(requestedPaths, <String>[
      '/notification-push-devices',
      '/notification-push-devices/device-1/revoke',
    ]);
  });

  test('lists authenticated push devices with redacted token tails only', () async {
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          expect(request.url.path, '/notification-push-devices');
          expect(request.headers['authorization'], 'Bearer token-123');

          return http.Response(
            jsonEncode(<Map<String, dynamic>>[
              {
                'id': 'device-1',
                'platform': 'android',
                'provider': 'fcm',
                'deviceTokenTail': 'e-1234567890',
                'isActive': true,
                'lastSeenAt': '2026-06-26T12:00:00.000Z',
              },
              {
                'id': 'device-2',
                'platform': 'ios',
                'provider': 'apns',
                'deviceTokenTail': 'ios-token-tail',
                'isActive': false,
                'revokedAt': '2026-06-26T12:05:00.000Z',
                'lastSeenAt': '2026-06-26T11:00:00.000Z',
              },
            ]),
            200,
          );
        }),
      ),
    );

    final devices = await gateway.fetchPushDevices('token-123');

    expect(devices, hasLength(2));
    expect(devices.first.deviceTokenTail, 'e-1234567890');
    expect(devices.first.isActive, isTrue);
    expect(devices.last.platform, 'ios');
    expect(devices.last.revokedAt, '2026-06-26T12:05:00.000Z');
  });

  test('updates notification quiet-hour preferences', () async {
    Map<String, dynamic>? capturedBody;
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          expect(request.url.path, '/notification-preferences');
          expect(request.headers['authorization'], 'Bearer token-123');
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;

          return http.Response(
            jsonEncode(<String, dynamic>{
              'inAppEnabled': true,
              'priceDropsEnabled': true,
              'receiptOutcomesEnabled': true,
              'optimizationReadyEnabled': true,
              'emailEnabled': false,
              'pushEnabled': true,
              'quietHoursEnabled': true,
              'quietHoursStartMinute': 1320,
              'quietHoursEndMinute': 420,
              'quietHoursTimezone': 'America/Sao_Paulo',
            }),
            200,
          );
        }),
      ),
    );

    final preferences = await gateway.updateNotificationPreferences(
      accessToken: 'token-123',
      pushEnabled: true,
      quietHoursEnabled: true,
      quietHoursStartMinute: 1320,
      quietHoursEndMinute: 420,
      quietHoursTimezone: 'America/Sao_Paulo',
    );

    expect(capturedBody?['pushEnabled'], isTrue);
    expect(capturedBody?['quietHoursEnabled'], isTrue);
    expect(capturedBody?['quietHoursStartMinute'], 1320);
    expect(preferences.quietHoursEnabled, isTrue);
    expect(preferences.quietHoursTimezone, 'America/Sao_Paulo');
  });

  test('fetches notification preferences and sends only changed preference fields', () async {
    final requestedMethods = <String>[];
    Map<String, dynamic>? patchBody;
    final gateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          requestedMethods.add(request.method);
          expect(request.url.path, '/notification-preferences');
          expect(request.headers['authorization'], 'Bearer token-123');

          if (request.method == 'GET') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'inAppEnabled': true,
                'priceDropsEnabled': false,
                'receiptOutcomesEnabled': true,
                'optimizationReadyEnabled': true,
                'emailEnabled': false,
                'pushEnabled': false,
                'quietHoursEnabled': false,
                'quietHoursStartMinute': null,
                'quietHoursEndMinute': null,
                'quietHoursTimezone': null,
              }),
              200,
            );
          }

          patchBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode(<String, dynamic>{
              'inAppEnabled': true,
              'priceDropsEnabled': false,
              'receiptOutcomesEnabled': true,
              'optimizationReadyEnabled': true,
              'emailEnabled': false,
              'pushEnabled': false,
              'quietHoursEnabled': true,
              'quietHoursStartMinute': 1320,
              'quietHoursEndMinute': 420,
              'quietHoursTimezone': 'America/Sao_Paulo',
            }),
            200,
          );
        }),
      ),
    );

    final initial = await gateway.fetchNotificationPreferences('token-123');
    final updated = await gateway.updateNotificationPreferences(
      accessToken: 'token-123',
      quietHoursEnabled: true,
    );

    expect(initial.priceDropsEnabled, isFalse);
    expect(patchBody, <String, dynamic>{'quietHoursEnabled': true});
    expect(updated.quietHoursStartMinute, 1320);
    expect(requestedMethods, <String>['GET', 'PATCH']);
  });
}
