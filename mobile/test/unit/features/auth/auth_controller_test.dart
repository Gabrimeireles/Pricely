import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('bootstraps an existing shared session from stored token', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-123');

    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path.endsWith('/auth/me')) {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'user-1',
                'email': 'cliente@pricely.app',
                'displayName': 'Cliente Pricely',
                'role': 'customer',
                'profileStats': <String, dynamic>{
                  'shoppingListsCount': 2,
                  'totalEstimatedSavings': 18.9,
                  'completedOptimizationRuns': 1,
                  'contributionsCount': 0,
                  'receiptSubmissionsCount': 0,
                  'offerReportsCount': 0,
                },
              }),
              200,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );

    final controller = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );

    await controller.bootstrap();

    expect(controller.isAuthenticated, isTrue);
    expect(controller.currentUser?.email, 'cliente@pricely.app');
    expect(controller.currentUser?.shoppingListsCount, 2);
  });

  test('signs in and persists the shared-account token', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());

    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path.endsWith('/auth/login')) {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'accessToken': 'jwt-456',
                'user': <String, dynamic>{
                  'id': 'user-2',
                  'email': 'admin@pricely.app',
                  'displayName': 'Admin Pricely',
                  'role': 'admin',
                  'profileStats': <String, dynamic>{
                    'shoppingListsCount': 3,
                    'totalEstimatedSavings': 44.1,
                    'completedOptimizationRuns': 4,
                    'contributionsCount': 1,
                    'receiptSubmissionsCount': 0,
                    'offerReportsCount': 0,
                  },
                },
              }),
              200,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );

    final controller = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );

    await controller.signIn(
      email: 'admin@pricely.app',
      password: 'admin-password',
    );

    expect(controller.isAuthenticated, isTrue);
    expect(controller.currentUser?.role, 'admin');
    expect(await cacheService.loadAuthToken(), 'jwt-456');
  });
}
