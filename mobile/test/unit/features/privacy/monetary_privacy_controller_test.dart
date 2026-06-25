import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/features/privacy/application/monetary_privacy_controller.dart';

import '../../../support/in_memory_key_value_store.dart';

void main() {
  test('persists monetary visibility across controller instances', () async {
    final store = InMemoryKeyValueStore();
    final controller = MonetaryPrivacyController(store);
    await controller.initialize();

    expect(controller.isVisible, isTrue);
    expect(controller.formatCurrency(12.5), 'R\$ 12,50');
    await controller.toggle();
    expect(controller.isVisible, isFalse);
    expect(controller.formatCurrency(12.5), 'R\$ ***');

    final restoredController = MonetaryPrivacyController(store);
    await restoredController.initialize();
    expect(restoredController.isVisible, isFalse);
  });
}
