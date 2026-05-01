import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/optimization/domain/optimization_result.dart';
import 'package:pricely_mobile/features/optimization/presentation/multi_market_result_screen.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  testWidgets('renders total, stores, and unavailable items', (tester) async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(client: MockClient((request) async => throw UnimplementedError())),
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
    await shoppingListController.addItem(
      name: 'Camil · Arroz',
      brandPreferenceMode: 'exact',
      quantity: 1,
      unit: 'pct',
    );

    final result = OptimizationResult(
      shoppingListTitle: 'Lista da semana',
      generatedAt: DateTime.parse('2026-04-05T12:00:00.000Z'),
      status: 'completed',
      totalCost: 54.7,
      estimatedSavings: 8.5,
      unavailableItems: <String>['Leite vegetal'],
      storePlans: <StoreOptimizationPlan>[
        StoreOptimizationPlan(
          storeName: 'Mercado Azul',
          subtotal: 34.2,
          selections: <OptimizationSelection>[
            OptimizationSelection(
              itemName: 'Camil · Arroz',
              storeName: 'Mercado Azul',
              quantity: 1,
              unit: 'pct',
              unitPrice: 22.9,
              subtotal: 22.9,
              confidenceLabel: 'high',
            ),
          ],
        ),
        StoreOptimizationPlan(
          storeName: 'Super Verde',
          subtotal: 20.5,
          selections: <OptimizationSelection>[
            OptimizationSelection(
              itemName: 'Banana',
              storeName: 'Super Verde',
              quantity: 5,
              unit: 'un',
              unitPrice: 4.1,
              subtotal: 20.5,
              confidenceLabel: 'medium',
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MultiMarketResultView(
            result: result,
            shoppingListController: shoppingListController,
          ),
        ),
      ),
    );

    expect(find.text('Lista da semana'), findsOneWidget);
    expect(find.text('Mercado Azul'), findsOneWidget);
    expect(find.text('Super Verde'), findsOneWidget);
    expect(find.textContaining('Economia estimada'), findsOneWidget);
    expect(find.textContaining('variante exata: Camil · Arroz'), findsOneWidget);
    expect(find.text('- Leite vegetal'), findsOneWidget);
  });
}
