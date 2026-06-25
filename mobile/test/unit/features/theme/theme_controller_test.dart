import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/features/theme/application/theme_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('persists the selected application theme', () async {
    final store = InMemoryKeyValueStore();
    final controller = ThemeController(store);
    await controller.initialize();
    expect(controller.themeMode, ThemeMode.system);

    await controller.setThemeMode(ThemeMode.dark);
    final restored = ThemeController(store);
    await restored.initialize();

    expect(restored.themeMode, ThemeMode.dark);
  });
}
