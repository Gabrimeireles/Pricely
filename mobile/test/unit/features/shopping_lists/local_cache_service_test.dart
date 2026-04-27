import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/optimization/domain/optimization_result.dart';
import 'package:pricely_mobile/features/shopping_lists/domain/shopping_list_draft.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('persists shopping list drafts and optimization results', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    final draft = ShoppingListDraft(
      id: 'list-1',
      title: 'Feira',
      regionId: 'sao-paulo-sp',
      lastMode: 'global_full',
      items: const <ShoppingListItemDraft>[
        ShoppingListItemDraft(id: '1', name: 'Banana', quantity: 6, unit: 'un'),
      ],
    );
    final result = OptimizationResult(
      shoppingListTitle: 'Feira',
      generatedAt: DateTime.parse('2026-04-05T12:00:00.000Z'),
      status: 'completed',
      totalCost: 29.9,
      estimatedSavings: 4.2,
      unavailableItems: const <String>['Cafe'],
      storePlans: <StoreOptimizationPlan>[
        const StoreOptimizationPlan(
          storeName: 'Mercado Azul',
          subtotal: 29.9,
          selections: <OptimizationSelection>[
            OptimizationSelection(
              itemName: 'Banana',
              storeName: 'Mercado Azul',
              quantity: 6,
              unit: 'un',
              unitPrice: 4.98,
              subtotal: 29.9,
              confidenceLabel: 'high',
            ),
          ],
        ),
      ],
    );

    await cacheService.saveShoppingListDraft(draft);
    await cacheService.saveOptimizationResult(result);

    final cachedDraft = await cacheService.loadShoppingListDraft();
    final cachedResult = await cacheService.loadOptimizationResult();

    expect(cachedDraft?.title, 'Feira');
    expect(cachedDraft?.items.single.name, 'Banana');
    expect(cachedResult?.totalCost, 29.9);
    expect(cachedResult?.unavailableItems, <String>['Cafe']);
  });
}
