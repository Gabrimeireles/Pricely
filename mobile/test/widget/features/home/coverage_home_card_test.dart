import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/discovery/application/market_discovery_controller.dart';
import 'package:pricely_mobile/features/home/presentation/mobile_home_screen.dart';
import 'package:pricely_mobile/features/location/application/mobile_location_controller.dart';
import 'package:pricely_mobile/features/optimization/application/optimization_controller.dart';
import 'package:pricely_mobile/features/optimization/data/demo_grocery_workflow_gateway.dart';
import 'package:pricely_mobile/features/receipts/application/receipt_flow_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

PricelyBackendGateway _makeBackend() {
  return PricelyBackendGateway(
    HttpApiClient(
      client: MockClient((request) async {
        if (request.url.path == '/auth/me') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'id': 'user-1',
              'email': 'c@pricely.app',
              'displayName': 'Cliente Pricely',
              'role': 'customer',
              'preferredRegionSlug': 'sao-paulo-sp',
              'profileStats': <String, dynamic>{
                'shoppingListsCount': 0,
                'totalEstimatedSavings': 0,
                'completedOptimizationRuns': 0,
                'contributionsCount': 0,
                'receiptSubmissionsCount': 0,
                'offerReportsCount': 0,
              },
            }),
            200,
          );
        }
        if (request.url.path == '/regions') {
          return http.Response(
            jsonEncode(<dynamic>[
              <String, dynamic>{
                'id': 'region-1',
                'slug': 'sao-paulo-sp',
                'name': 'Sao Paulo',
                'stateCode': 'SP',
                'implantationStatus': 'active',
                'activeEstablishmentCount': 4,
                'offerCoverageStatus': 'live',
              },
            ]),
            200,
          );
        }
        if (request.url.path == '/regions/sao-paulo-sp/offers') {
          return http.Response(
            jsonEncode(<String, dynamic>{'offers': <dynamic>[]}),
            200,
          );
        }
        if (request.url.path == '/locations/coverage-preview') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'regionId': 'region-1',
              'coverageRadiusKm': 5,
              'activeEstablishmentCount': 4,
              'fallbackUsed': false,
              'establishments': <dynamic>[],
            }),
            200,
          );
        }
        if (request.url.path == '/locations') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'id': 'location-1',
              'regionId': 'region-1',
              'regionSlug': 'sao-paulo-sp',
              'label': 'Local atual',
              'latitude': -23.56,
              'longitude': -46.65,
              'coverageRadiusKm': 5,
              'activeEstablishmentCount': 4,
              'isDefault': true,
              'locationSource': 'browser_geolocation',
            }),
            201,
          );
        }
        return http.Response('{}', 404);
      }),
    ),
  );
}

Future<Widget> _buildHome({
  required MobileLocationService locationService,
}) async {
  final cacheService = LocalCacheService(InMemoryKeyValueStore());
  await cacheService.saveAuthToken('token-xyz');

  final backendGateway = _makeBackend();
  final authController = AuthController(
    cacheService: cacheService,
    backendGateway: backendGateway,
  );
  await authController.bootstrap();

  final discoveryController = MarketDiscoveryController(backendGateway);
  await discoveryController.loadInitialData();
  await discoveryController.selectRegion('sao-paulo-sp');

  final shoppingListController = ShoppingListController(
    cacheService: cacheService,
    authController: authController,
    backendGateway: backendGateway,
  );
  final optimizationController = OptimizationController(
    cacheService: cacheService,
    shoppingListController: shoppingListController,
    backendGateway: backendGateway,
    authController: authController,
  );
  final locationController = MobileLocationController(
    authController: authController,
    discoveryController: discoveryController,
    backendGateway: backendGateway,
    locationService: locationService,
  );
  final receiptController = ReceiptFlowController(DemoGroceryWorkflowGateway());

  return MaterialApp(
    home: MobileHomeScreen(
      authController: authController,
      discoveryController: discoveryController,
      shoppingListController: shoppingListController,
      optimizationController: optimizationController,
      receiptFlowController: receiptController,
      locationController: locationController,
    ),
  );
}

void main() {
  testWidgets('shows Manual status pill and radius info before any GPS request', (tester) async {
    final widget = await _buildHome(locationService: const _ManualLocationService());

    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.textContaining('e raio'), 220);
    expect(find.text('Manual'), findsOneWidget);
    expect(find.textContaining('4 lojas em 5 km'), findsOneWidget);
    expect(find.text('Usar localização atual'), findsOneWidget);
  });

  testWidgets('shows Negada status pill and no proximity claim when permission denied', (tester) async {
    final widget = await _buildHome(locationService: const _DeniedLocationService());

    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.textContaining('e raio'), 220);
    await tester.tap(find.text('Usar localização atual'));
    await tester.pumpAndSettle();

    expect(find.text('Negada'), findsOneWidget);
    expect(find.textContaining('Permissao negada'), findsOneWidget);
    expect(find.textContaining('nao representa distancia real'), findsNothing);
  });

  testWidgets('shows GPS off status when location service is disabled', (tester) async {
    final widget = await _buildHome(locationService: const _ServiceDisabledLocationService());

    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.textContaining('e raio'), 220);
    await tester.tap(find.text('Usar localização atual'));
    await tester.pumpAndSettle();

    expect(find.text('GPS off'), findsOneWidget);
    expect(find.textContaining('Servico de localizacao desligado'), findsOneWidget);
  });

  testWidgets('shows coverage preview count and Salva status after GPS is granted', (tester) async {
    final widget = await _buildHome(locationService: const _AllowedLocationService());

    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.textContaining('e raio'), 220);
    await tester.tap(find.text('Usar localização atual'));
    await tester.pumpAndSettle();

    expect(find.text('Salva'), findsOneWidget);
    expect(find.textContaining('Preview local: 4 lojas'), findsOneWidget);
    expect(find.textContaining('4 lojas em 5 km'), findsOneWidget);
  });
}

class _ManualLocationService implements MobileLocationService {
  const _ManualLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    return const MobileLocationCaptureResult(status: MobileLocationStatus.manual);
  }
}

class _DeniedLocationService implements MobileLocationService {
  const _DeniedLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    return const MobileLocationCaptureResult(status: MobileLocationStatus.denied);
  }
}

class _ServiceDisabledLocationService implements MobileLocationService {
  const _ServiceDisabledLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    return const MobileLocationCaptureResult(status: MobileLocationStatus.serviceDisabled);
  }
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
        accuracyMeters: 15,
      ),
    );
  }
}
