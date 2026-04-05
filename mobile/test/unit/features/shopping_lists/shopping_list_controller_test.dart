import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/shopping_lists/application/shopping_list_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('adds items and persists the shopping list draft', () async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    final controller = ShoppingListController(cacheService);

    await controller.loadDraft();
    await controller.updateTitle('Churrasco');
    await controller.addItem(name: 'Carvao', quantity: 2);

    expect(controller.draft.title, 'Churrasco');
    expect(controller.draft.items, hasLength(1));
    expect(controller.draft.items.single.name, 'Carvao');

    final restoredDraft = await cacheService.loadShoppingListDraft();
    expect(restoredDraft?.title, 'Churrasco');
    expect(restoredDraft?.items.single.quantity, 2);
  });
}
