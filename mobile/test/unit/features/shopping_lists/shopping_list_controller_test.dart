import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('adds items and persists the shopping list draft', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
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

          if (request.url.path.endsWith('/shopping-lists')) {
            return http.Response(jsonEncode(<dynamic>[]), 200);
          }

          return http.Response('{}', 200);
        }),
      ),
    );
    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    final controller = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );

    await controller.loadDraft();
    await controller.updateTitle('Churrasco');
    await controller.addItem(name: 'Carvão', quantity: 2);

    expect(controller.draft.title, 'Churrasco');
    expect(controller.draft.items, hasLength(1));
    expect(controller.draft.items.single.name, 'Carvão');

    final restoredDraft = await cacheService.loadShoppingListDraft();
    expect(restoredDraft?.title, 'Churrasco');
    expect(restoredDraft?.items.single.quantity, 2);
  });

  test('stores brand preference metadata and toggles purchased state', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path.contains('/catalog-products/search')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'catalog-1',
                  'slug': 'arroz-tipo-1-1kg',
                  'name': 'Arroz tipo 1 1kg',
                  'category': 'Mercearia',
                  'defaultUnit': 'un',
                  'imageUrl': 'https://example.com/arroz.jpg',
                  'productVariants': <dynamic>[],
                },
              ]),
              200,
            );
          }

          if (request.url.path.contains('/catalog-products/catalog-1/variants')) {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'variant-1',
                  'catalogProductId': 'catalog-1',
                  'displayName': 'Arroz Tipo 1 1kg',
                  'brandName': 'Camil',
                  'packageLabel': 'Pacote 1kg',
                  'imageUrl': 'https://example.com/arroz-camil.jpg',
                  'isActive': true,
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
    final controller = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );

    await controller.loadDraft();
    await controller.searchCatalog('Arroz');
    await controller.loadVariants('catalog-1');
    await controller.addItem(
      name: 'Arroz',
      catalogProductId: 'catalog-1',
      lockedProductVariantId: 'variant-1',
      brandPreferenceMode: 'exact',
      preferredBrandNames: const <String>['Camil'],
      imageUrl: 'https://example.com/arroz-camil.jpg',
      quantity: 1,
      unit: 'un',
    );

    expect(controller.catalogResults, hasLength(1));
    expect(controller.variantResults, hasLength(1));
    expect(controller.draft.items.single.brandPreferenceMode, 'exact');
    expect(controller.draft.items.single.lockedProductVariantId, 'variant-1');

    await controller.togglePurchased(controller.draft.items.single.id);

    expect(controller.draft.items.single.purchaseStatus, 'purchased');
  });

  test('syncs purchased state through the backend when the list is persisted', () async {
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
                      'requestedName': 'Arroz tipo 1 1kg',
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
                    'requestedName': 'Arroz tipo 1 1kg',
                    'quantity': 1,
                    'unitLabel': 'un',
                    'purchaseStatus': payload['purchaseStatus'],
                    'resolutionStatus': 'matched',
                  },
                ],
                'createdAt': '2026-04-28T12:00:00.000Z',
                'updatedAt': '2026-04-28T12:05:00.000Z',
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

    final controller = ShoppingListController(
      cacheService: cacheService,
      authController: authController,
      backendGateway: backendGateway,
    );

    await controller.loadDraft();
    await controller.togglePurchased('item-1');

    expect(controller.draft.id, 'list-1');
    expect(controller.draft.items.single.purchaseStatus, 'purchased');
  });
}
