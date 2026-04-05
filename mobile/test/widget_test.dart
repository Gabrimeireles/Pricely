import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/app/app.dart';

void main() {
  testWidgets('Pricely app bootstraps', (WidgetTester tester) async {
    await tester.pumpWidget(const PricelyApp());

    expect(find.byType(PricelyApp), findsOneWidget);
  });
}
