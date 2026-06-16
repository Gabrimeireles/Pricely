import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/discovery/application/market_discovery_controller.dart';
import 'package:pricely_mobile/features/location/application/mobile_location_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('captures and saves mobile coordinates for the selected region', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-123');
    Map<String, dynamic>? savedLocationPayload;
    Map<String, dynamic>? previewPayload;

    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path == '/auth/me') {
            return http.Response(jsonEncode(_profilePayload()), 200);
          }

          if (request.url.path == '/regions') {
            return http.Response(jsonEncode(_regionsPayload()), 200);
          }

          if (request.url.path == '/regions/sao-paulo-sp/offers') {
            return http.Response(jsonEncode(<String, dynamic>{'offers': <dynamic>[]}), 200);
          }

          if (request.url.path == '/locations') {
            savedLocationPayload =
                jsonDecode(request.body) as Map<String, dynamic>;
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'location-1',
                'regionId': 'region-1',
                'regionSlug': 'sao-paulo-sp',
                'label': 'Local atual',
                'latitude': -23.56,
                'longitude': -46.65,
                'coverageRadiusKm': 5,
                'activeEstablishmentCount': 2,
                'isDefault': true,
                'locationSource': 'browser_geolocation',
              }),
              201,
            );
          }

          if (request.url.path == '/locations/coverage-preview') {
            previewPayload = jsonDecode(request.body) as Map<String, dynamic>;
            return http.Response(
              jsonEncode(<String, dynamic>{
                'regionId': 'region-1',
                'coverageRadiusKm': 5,
                'activeEstablishmentCount': 2,
                'fallbackUsed': false,
                'establishments': <dynamic>[],
              }),
              200,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );
    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();
    final discoveryController = MarketDiscoveryController(backendGateway);
    await discoveryController.loadInitialData();
    await discoveryController.selectRegion('sao-paulo-sp');

    final controller = MobileLocationController(
      authController: authController,
      discoveryController: discoveryController,
      backendGateway: backendGateway,
      locationService: const _AllowedLocationService(),
    );

    await controller.captureAndSave();

    expect(controller.status, MobileLocationStatus.allowed);
    expect(controller.coveragePreview?.activeEstablishmentCount, 2);
    expect(controller.message, contains('Preview local: 2 lojas'));
    expect(controller.activePreference?.id, 'location-1');
    expect(controller.preferenceIdForRegionSlug('sao-paulo-sp'), 'location-1');
    expect(previewPayload?['regionId'], 'region-1');
    expect(previewPayload?['latitude'], -23.56);
    expect(savedLocationPayload?['regionId'], 'region-1');
    expect(savedLocationPayload?['latitude'], -23.56);
    expect(savedLocationPayload?['longitude'], -46.65);
    expect(savedLocationPayload?['coverageRadiusKm'], 5);
  });

  test('keeps local optimization unavailable when permission is denied', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-123');
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path == '/auth/me') {
            return http.Response(jsonEncode(_profilePayload()), 200);
          }

          if (request.url.path == '/regions') {
            return http.Response(jsonEncode(_regionsPayload()), 200);
          }

          if (request.url.path == '/regions/sao-paulo-sp/offers') {
            return http.Response(jsonEncode(<String, dynamic>{'offers': <dynamic>[]}), 200);
          }

          return http.Response('{}', 404);
        }),
      ),
    );
    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();
    final discoveryController = MarketDiscoveryController(backendGateway);
    await discoveryController.loadInitialData();
    await discoveryController.selectRegion('sao-paulo-sp');
    final controller = MobileLocationController(
      authController: authController,
      discoveryController: discoveryController,
      backendGateway: backendGateway,
      locationService: const _DeniedLocationService(),
    );

    await controller.captureAndSave();

    expect(controller.status, MobileLocationStatus.denied);
    expect(controller.activePreference, isNull);
    expect(controller.message, contains('Permissao negada'));
  });
}

Map<String, dynamic> _profilePayload() {
  return <String, dynamic>{
    'id': 'user-1',
    'email': 'cliente@pricely.app',
    'displayName': 'Cliente Pricely',
    'role': 'customer',
    'preferredRegionSlug': 'sao-paulo-sp',
    'profileStats': <String, dynamic>{
      'shoppingListsCount': 1,
      'totalEstimatedSavings': 12.3,
      'completedOptimizationRuns': 1,
      'contributionsCount': 0,
      'receiptSubmissionsCount': 0,
      'offerReportsCount': 0,
    },
  };
}

List<dynamic> _regionsPayload() {
  return <dynamic>[
    <String, dynamic>{
      'id': 'region-1',
      'slug': 'sao-paulo-sp',
      'name': 'Sao Paulo',
      'stateCode': 'SP',
      'implantationStatus': 'active',
      'activeEstablishmentCount': 2,
      'offerCoverageStatus': 'live',
    },
  ];
}

class _AllowedLocationService implements MobileLocationService {
  const _AllowedLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    return const MobileLocationCaptureResult(
      status: MobileLocationStatus.allowed,
      reading: MobileLocationReading(
        latitude: -23.56,
        longitude: -46.65,
        accuracyMeters: 25,
      ),
    );
  }
}

class _DeniedLocationService implements MobileLocationService {
  const _DeniedLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    return const MobileLocationCaptureResult(
      status: MobileLocationStatus.denied,
    );
  }
}
