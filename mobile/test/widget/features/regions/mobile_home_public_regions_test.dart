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
import 'package:pricely_mobile/features/optimization/application/optimization_controller.dart';
import 'package:pricely_mobile/features/optimization/data/demo_grocery_workflow_gateway.dart';
import 'package:pricely_mobile/features/receipts/application/receipt_flow_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  testWidgets('shows zero-store messaging for collecting regions', (
    tester,
  ) async {
    final app = await _buildApp(preselectedRegionSlug: null);

    await tester.pumpWidget(app.widget);
    await tester.pumpAndSettle();

    expect(
      find.textContaining('Ainda'),
      findsOneWidget,
    );
    expect(
      find.textContaining('contribuir com recibos'),
      findsOneWidget,
    );
  });

  testWidgets('renders active city offers and opens the offer detail sheet', (tester) async {
    final app = await _buildApp(preselectedRegionSlug: 'sao-paulo-sp');

    await tester.pumpWidget(app.widget);
    await tester.pumpAndSettle();

    expect(find.byType(DropdownButtonFormField<String>), findsOneWidget);
    expect(find.textContaining('2 lojas'), findsOneWidget);
    expect(app.discoveryController.offers, hasLength(1));
    expect(app.discoveryController.offers.single.productName, 'Cafe torrado');
    final detail =
        await app.discoveryController.fetchOfferDetail(app.discoveryController.offers.single.id);
    expect(detail.productName, 'Cafe torrado');
    expect(detail.alternativeOffers.single.storeName, 'Mercado Bairro');
  });
}

Future<_MobileHomeHarness> _buildApp({
  required String? preselectedRegionSlug,
}) async {
  final backendGateway = PricelyBackendGateway(
    HttpApiClient(
      client: MockClient((request) async {
        if (request.url.path == '/regions') {
          return http.Response(
            jsonEncode(<dynamic>[
              <String, dynamic>{
                'id': 'region-1',
                'slug': 'campinas-sp',
                'name': 'Campinas',
                'stateCode': 'SP',
                'implantationStatus': 'activating',
                'activeEstablishmentCount': 0,
                'offerCoverageStatus': 'collecting_data',
              },
              <String, dynamic>{
                'id': 'region-2',
                'slug': 'sao-paulo-sp',
                'name': 'Sao Paulo',
                'stateCode': 'SP',
                'implantationStatus': 'active',
                'activeEstablishmentCount': 2,
                'offerCoverageStatus': 'live',
              },
            ]),
            200,
          );
        }

        if (request.url.path == '/regions/campinas-sp/offers') {
          return http.Response(
            jsonEncode(<String, dynamic>{'offers': <dynamic>[]}),
            200,
          );
        }

        if (request.url.path == '/regions/sao-paulo-sp/offers') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'offers': <dynamic>[
                <String, dynamic>{
                  'id': 'offer-1',
                  'productId': 'product-1',
                  'productName': 'Cafe torrado',
                  'displayName': 'Cafe torrado 500g',
                  'packageLabel': '500 g',
                  'priceAmount': 15.9,
                  'observedAt': '2026-04-27T10:00:00.000Z',
                  'sourceLabel': 'Painel admin',
                  'storeName': 'Mercado Centro',
                  'neighborhood': 'Centro',
                  'confidenceLevel': 'high',
                },
              ],
            }),
            200,
          );
        }

        if (request.url.path == '/offers/offer-1') {
          return http.Response(
            jsonEncode(<String, dynamic>{
              'id': 'offer-1',
              'product': <String, dynamic>{
                'id': 'product-1',
                'name': 'Cafe torrado',
                'category': 'Mercearia',
                'imageUrl': null,
              },
              'activeOffer': <String, dynamic>{
                'id': 'offer-1',
                'displayName': 'Cafe torrado 500g',
                'packageLabel': '500 g',
                'priceAmount': 15.9,
                'observedAt': '2026-04-27T10:00:00.000Z',
                'sourceLabel': 'Painel admin',
                'storeName': 'Mercado Centro',
                'neighborhood': 'Centro',
                'confidenceLevel': 'high',
              },
              'alternativeOffers': <dynamic>[
                <String, dynamic>{
                  'id': 'offer-2',
                  'packageLabel': '500 g',
                  'priceAmount': 16.4,
                  'observedAt': '2026-04-27T10:10:00.000Z',
                  'sourceLabel': 'Painel admin',
                  'storeName': 'Mercado Bairro',
                  'neighborhood': 'Pinheiros',
                  'confidenceLevel': 'medium',
                },
              ],
            }),
            200,
          );
        }

        return http.Response('{}', 404);
      }),
    ),
  );

  final cacheService = LocalCacheService(InMemoryKeyValueStore());
  final authController = AuthController(
    cacheService: cacheService,
    backendGateway: backendGateway,
  );
  await authController.bootstrap();

  final discoveryController = MarketDiscoveryController(backendGateway);
  await discoveryController.loadInitialData();
  if (preselectedRegionSlug != null) {
    await discoveryController.selectRegion(preselectedRegionSlug);
  }

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
  final receiptFlowController = ReceiptFlowController(
    DemoGroceryWorkflowGateway(),
  );

  return _MobileHomeHarness(
    MaterialApp(
      home: MobileHomeScreen(
        authController: authController,
        discoveryController: discoveryController,
        shoppingListController: shoppingListController,
        optimizationController: optimizationController,
        receiptFlowController: receiptFlowController,
      ),
    ),
    discoveryController,
  );
}

class _MobileHomeHarness {
  const _MobileHomeHarness(this.widget, this.discoveryController);

  final Widget widget;
  final MarketDiscoveryController discoveryController;
}
