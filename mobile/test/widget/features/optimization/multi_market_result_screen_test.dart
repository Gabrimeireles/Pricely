import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/features/optimization/domain/optimization_result.dart';
import 'package:pricely_mobile/features/optimization/presentation/multi_market_result_screen.dart';

void main() {
  testWidgets('renders total, stores, and unavailable items', (tester) async {
    final result = OptimizationResult(
      shoppingListTitle: 'Lista da semana',
      generatedAt: DateTime.parse('2026-04-05T12:00:00.000Z'),
      totalCost: 54.7,
      estimatedSavings: 8.5,
      unavailableItems: <String>['Leite vegetal'],
      storePlans: <StoreOptimizationPlan>[
        StoreOptimizationPlan(
          storeName: 'Mercado Azul',
          subtotal: 34.2,
          selections: <OptimizationSelection>[
            OptimizationSelection(
              itemName: 'Arroz',
              storeName: 'Mercado Azul',
              quantity: 1,
              unit: 'pct',
              unitPrice: 22.9,
              subtotal: 22.9,
              confidenceLabel: 'high',
            ),
          ],
        ),
        StoreOptimizationPlan(
          storeName: 'Super Verde',
          subtotal: 20.5,
          selections: <OptimizationSelection>[
            OptimizationSelection(
              itemName: 'Banana',
              storeName: 'Super Verde',
              quantity: 5,
              unit: 'un',
              unitPrice: 4.1,
              subtotal: 20.5,
              confidenceLabel: 'medium',
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MultiMarketResultView(result: result),
        ),
      ),
    );

    expect(find.text('Lista da semana'), findsOneWidget);
    expect(find.text('Mercado Azul'), findsOneWidget);
    expect(find.text('Super Verde'), findsOneWidget);
    expect(find.textContaining('Economia estimada'), findsOneWidget);
    expect(find.text('• Leite vegetal'), findsOneWidget);
  });
}
