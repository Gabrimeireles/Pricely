import 'package:flutter/material.dart';

import '../../../core/storage/key_value_store.dart';

class ThemeController extends ChangeNotifier {
  ThemeController(this._keyValueStore);

  static const storageKey = 'theme_mode';

  final KeyValueStore _keyValueStore;
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  Future<void> initialize() async {
    final storedValue = await _keyValueStore.readString(storageKey);
    _themeMode = switch (storedValue) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> setThemeMode(ThemeMode value) async {
    if (_themeMode == value) {
      return;
    }
    _themeMode = value;
    await _keyValueStore.writeString(storageKey, value.name);
    notifyListeners();
  }
}
