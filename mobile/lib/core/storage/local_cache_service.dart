import 'dart:convert';

import '../../features/optimization/domain/optimization_result.dart';
import '../../features/shopping_lists/domain/shopping_list_draft.dart';
import 'key_value_store.dart';

class LocalCacheService {
  LocalCacheService(this._keyValueStore);

  static const shoppingListDraftKey = 'shopping_list_draft';
  static const optimizationResultKey = 'latest_optimization_result';

  final KeyValueStore _keyValueStore;

  Future<void> saveShoppingListDraft(ShoppingListDraft draft) async {
    await _keyValueStore.writeString(
      shoppingListDraftKey,
      jsonEncode(draft.toJson()),
    );
  }

  Future<ShoppingListDraft?> loadShoppingListDraft() async {
    final rawValue = await _keyValueStore.readString(shoppingListDraftKey);
    if (rawValue == null || rawValue.isEmpty) {
      return null;
    }

    return ShoppingListDraft.fromJson(
        jsonDecode(rawValue) as Map<String, dynamic>);
  }

  Future<void> saveOptimizationResult(OptimizationResult result) async {
    await _keyValueStore.writeString(
      optimizationResultKey,
      jsonEncode(result.toJson()),
    );
  }

  Future<OptimizationResult?> loadOptimizationResult() async {
    final rawValue = await _keyValueStore.readString(optimizationResultKey);
    if (rawValue == null || rawValue.isEmpty) {
      return null;
    }

    return OptimizationResult.fromJson(
        jsonDecode(rawValue) as Map<String, dynamic>);
  }
}
