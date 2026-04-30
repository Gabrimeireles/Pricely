import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/app/app.dart';
import 'package:pricely_mobile/app/app_services.dart';
import 'package:pricely_mobile/core/storage/key_value_store.dart';

void main() {
  testWidgets('Pricely app bootstraps', (WidgetTester tester) async {
    await tester.pumpWidget(
      PricelyApp(
        services: AppServices(
          keyValueStore: _InMemoryKeyValueStore(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Precos com contexto real'), findsOneWidget);
  });
}

class _InMemoryKeyValueStore implements KeyValueStore {
  final Map<String, String> _values = <String, String>{};

  @override
  Future<String?> readString(String key) async => _values[key];

  @override
  Future<void> remove(String key) async {
    _values.remove(key);
  }

  @override
  Future<void> writeString(String key, String value) async {
    _values[key] = value;
  }
}
