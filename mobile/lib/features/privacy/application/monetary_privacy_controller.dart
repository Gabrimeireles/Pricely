import 'package:flutter/foundation.dart';

import '../../../core/storage/key_value_store.dart';

class MonetaryPrivacyController extends ChangeNotifier {
  MonetaryPrivacyController(this._keyValueStore);

  static const storageKey = 'monetary_values_visible';

  final KeyValueStore _keyValueStore;
  bool _isVisible = true;

  bool get isVisible => _isVisible;

  String formatCurrency(double value) {
    if (!_isVisible) {
      return 'R\$ ***';
    }
    return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  Future<void> initialize() async {
    final storedValue = await _keyValueStore.readString(storageKey);
    _isVisible = storedValue != 'false';
  }

  Future<void> toggle() async {
    _isVisible = !_isVisible;
    await _keyValueStore.writeString(storageKey, _isVisible.toString());
    notifyListeners();
  }
}
