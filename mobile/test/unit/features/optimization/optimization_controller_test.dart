import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/optimization/application/optimization_controller.dart';
import 'package:pricely_mobile/features/optimization/domain/optimization_result.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('loads the latest optimization result from cache', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveOptimizationResult(
      _buildOptimizationResult(),
    );
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(client: MockClient((request) async => http.Response('{}', 404))),
    );
    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    final shoppingListController = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );
    final controller = OptimizationController(
      cacheService: cacheService,
      shoppingListController: shoppingListController,
      backendGateway: backendGateway,
      authController: authController,
    );

    await controller.loadCachedResult();

    expect(controller.result, isNotNull);
    expect(controller.result?.shoppingListTitle, 'Compra mensal');
    expect(controller.result?.status, 'completed');
  });

  test('runs optimization for the saved list and stores the latest result', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-123');

    var latestRequests = 0;
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
                  'totalEstimatedSavings': 12.3,
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
                      'requestedName': 'Arroz tipo 1',
                      'quantity': 1,
                      'unitLabel': 'un',
                      'purchaseStatus': 'pending',
                      'resolutionStatus': 'matched',
                    },
                  ],
                  'createdAt': '2026-04-28T12:00:00.000Z',
                  'updatedAt': '2026-04-28T12:00:00.000Z',
                },
              ]),
              200,
            );
          }

          if (request.url.path.endsWith('/shopping-lists/list-1/optimize')) {
            return http.Response(
              jsonEncode(<String, dynamic>{'acceptedStatus': 'queued'}),
              201,
            );
          }

          if (request.url.path.endsWith('/shopping-lists/list-1/optimizations/latest')) {
            latestRequests += 1;
            return http.Response(
              jsonEncode(_buildOptimizationPayload()),
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

    final shoppingListController = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );
    await shoppingListController.loadDraft();

    final controller = OptimizationController(
      cacheService: cacheService,
      shoppingListController: shoppingListController,
      backendGateway: backendGateway,
      authController: authController,
    );

    await controller.optimize();

    expect(latestRequests, greaterThanOrEqualTo(1));
    expect(controller.result, isNotNull);
    expect(controller.result?.status, 'completed');
    final cached = await cacheService.loadOptimizationResult();
    expect(cached?.totalCost, 22.9);
  });
}

Map<String, dynamic> _buildOptimizationPayload() {
  return <String, dynamic>{
    'shoppingListTitle': 'Compra mensal',
    'createdAt': '2026-04-28T12:00:00.000Z',
    'completedAt': '2026-04-28T12:00:05.000Z',
    'status': 'completed',
    'totalEstimatedCost': 22.9,
    'estimatedSavings': 4.4,
    'selections': <dynamic>[
      <String, dynamic>{
        'selectionStatus': 'selected',
        'shoppingListItemName': 'Arroz tipo 1',
        'establishmentName': 'Unidade Pinheiros',
        'priceAmount': 22.9,
        'confidenceNotice': 'confirmado',
      },
    ],
  };
}

OptimizationResult _buildOptimizationResult() {
  return OptimizationResult(
    shoppingListTitle: 'Compra mensal',
    generatedAt: DateTime.parse('2026-04-28T12:00:05.000Z'),
    status: 'completed',
    totalCost: 22.9,
    estimatedSavings: 4.4,
    unavailableItems: const <String>[],
    storePlans: const <StoreOptimizationPlan>[
      StoreOptimizationPlan(
        storeName: 'Unidade Pinheiros',
        subtotal: 22.9,
        selections: <OptimizationSelection>[
          OptimizationSelection(
            itemName: 'Arroz tipo 1',
            storeName: 'Unidade Pinheiros',
            quantity: 1,
            unit: 'un',
            unitPrice: 22.9,
            subtotal: 22.9,
            confidenceLabel: 'confirmado',
          ),
        ],
      ),
    ],
  );
}
