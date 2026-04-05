import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../domain/shopping_list_draft.dart';

class ShoppingListController extends ChangeNotifier {
  ShoppingListController(this._cacheService);

  final LocalCacheService _cacheService;

  ShoppingListDraft _draft = ShoppingListDraft.empty();
  bool _isReady = false;

  ShoppingListDraft get draft => _draft;
  bool get isReady => _isReady;

  Future<void> loadDraft() async {
    _draft = await _cacheService.loadShoppingListDraft() ??
        ShoppingListDraft.empty();
    _isReady = true;
    notifyListeners();
  }

  Future<void> updateTitle(String title) async {
    _draft = _draft.copyWith(title: title);
    await _persist();
  }

  Future<void> addItem({
    required String name,
    int quantity = 1,
    String unit = 'un',
  }) async {
    if (name.trim().isEmpty) {
      return;
    }

    final nextItems = List<ShoppingListItemDraft>.from(_draft.items)
      ..add(
        ShoppingListItemDraft(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          name: name.trim(),
          quantity: quantity,
          unit: unit,
        ),
      );

    _draft = _draft.copyWith(items: nextItems);
    await _persist();
  }

  Future<void> removeItem(String itemId) async {
    _draft = _draft.copyWith(
      items: _draft.items.where((item) => item.id != itemId).toList(),
    );
    await _persist();
  }

  Future<void> _persist() async {
    await _cacheService.saveShoppingListDraft(_draft);
    notifyListeners();
  }
}
