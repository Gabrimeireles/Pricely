import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/optimization/application/optimization_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';
import 'package:pricely_mobile/features/shopping_lists/presentation/shopping_list_screen.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  testWidgets('renders the authenticated list flow and supports catalog search', (tester) async {
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
                  'shoppingListsCount': 1,
                  'totalEstimatedSavings': 12.4,
                  'completedOptimizationRuns': 1,
                  'contributionsCount': 0,
                  'receiptSubmissionsCount': 0,
                  'offerReportsCount': 0,
                },
              }),
              200,
            );
          }

          if (request.url.path.endsWith('/shopping-lists')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'list-1',
                  'name': 'Compra mensal',
                  'preferredRegionId': 'sao-paulo-sp',
                  'lastMode': 'global_full',
                  'items': <dynamic>[
                    <String, dynamic>{
                      'id': 'item-1',
                      'requestedName': 'Cafe torrado',
                      'catalogProductId': 'catalog-1',
                      'quantity': 1,
                      'unitLabel': 'un',
                      'purchaseStatus': 'pending',
                      'imageUrl': 'https://example.com/cafe.jpg',
                    },
                  ],
                },
              ]),
              200,
            );
          }

          if (request.url.path.contains('/catalog-products/search')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'catalog-2',
                  'name': 'Leite integral 1L',
                  'category': 'Laticinios',
                  'defaultUnit': 'un',
                  'imageUrl': 'https://example.com/leite.jpg',
                },
              ]),
              200,
            );
          }

          if (request.url.path.endsWith('/shopping-lists/list-1/items/item-1/purchase-status')) {
            final payload = jsonDecode(request.body) as Map<String, dynamic>;
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'list-1',
                'name': 'Compra mensal',
                'preferredRegionId': 'sao-paulo-sp',
                'lastMode': 'global_full',
                'items': <dynamic>[
                  <String, dynamic>{
                    'id': 'item-1',
                    'requestedName': 'Cafe torrado',
                    'catalogProductId': 'catalog-1',
                    'quantity': 1,
                    'unitLabel': 'un',
                    'purchaseStatus': payload['purchaseStatus'],
                    'imageUrl': 'https://example.com/cafe.jpg',
                  },
                ],
              }),
              200,
            );
          }

          return http.Response('{}', 200);
        }),
      ),
    );

    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();

    final shoppingListController = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );
    await shoppingListController.loadDraft();

    final optimizationController = OptimizationController(
      cacheService: cacheService,
      shoppingListController: shoppingListController,
      backendGateway: backendGateway,
      authController: authController,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ShoppingListScreen(
          controller: shoppingListController,
          optimizationController: optimizationController,
          authController: authController,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Compra mensal'), findsWidgets);
    expect(find.text('Cliente Pricely'), findsOneWidget);
    expect(find.text('2. Escolha um produto comparável'), findsOneWidget);

    await tester.enterText(find.widgetWithText(TextField, 'Produto'), 'Leite');
    await tester.pumpAndSettle();

    expect(find.byType(DropdownButtonFormField<String>), findsWidgets);
  });

  testWidgets('toggles purchased state from the richer checklist card', (tester) async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-123');
    final purchaseUpdates = <String>[];

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
                  'shoppingListsCount': 1,
                  'totalEstimatedSavings': 12.4,
                  'completedOptimizationRuns': 1,
                  'contributionsCount': 0,
                  'receiptSubmissionsCount': 0,
                  'offerReportsCount': 0,
                },
              }),
              200,
            );
          }

          if (request.url.path.endsWith('/shopping-lists')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'list-1',
                  'name': 'Compra mensal',
                  'preferredRegionId': 'sao-paulo-sp',
                  'lastMode': 'global_full',
                  'items': <dynamic>[
                    <String, dynamic>{
                      'id': 'item-1',
                      'requestedName': 'Cafe torrado',
                      'catalogProductId': 'catalog-1',
                      'quantity': 1,
                      'unitLabel': 'un',
                      'purchaseStatus': 'pending',
                      'imageUrl': 'https://example.com/cafe.jpg',
                    },
                  ],
                },
              ]),
              200,
            );
          }

          if (request.url.path.endsWith('/shopping-lists/list-1/items/item-1/purchase-status')) {
            final payload = jsonDecode(request.body) as Map<String, dynamic>;
            purchaseUpdates.add(payload['purchaseStatus'] as String);

            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'list-1',
                'name': 'Compra mensal',
                'preferredRegionId': 'sao-paulo-sp',
                'lastMode': 'global_full',
                'items': <dynamic>[
                  <String, dynamic>{
                    'id': 'item-1',
                    'requestedName': 'Cafe torrado',
                    'catalogProductId': 'catalog-1',
                    'quantity': 1,
                    'unitLabel': 'un',
                    'purchaseStatus': payload['purchaseStatus'],
                    'imageUrl': 'https://example.com/cafe.jpg',
                  },
                ],
              }),
              200,
            );
          }

          if (request.url.path.contains('/catalog-products/search')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'catalog-1',
                  'name': 'Cafe torrado',
                  'category': 'Mercearia',
                  'defaultUnit': 'un',
                  'imageUrl': 'https://example.com/cafe.jpg',
                },
              ]),
              200,
            );
          }

          return http.Response('{}', 200);
        }),
      ),
    );

    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();

    final shoppingListController = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );
    await shoppingListController.loadDraft();

    final optimizationController = OptimizationController(
      cacheService: cacheService,
      shoppingListController: shoppingListController,
      backendGateway: backendGateway,
      authController: authController,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ShoppingListScreen(
          controller: shoppingListController,
          optimizationController: optimizationController,
          authController: authController,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await shoppingListController.togglePurchased('item-1');
    await tester.pumpAndSettle();

    expect(purchaseUpdates, <String>['purchased']);
  });
}
