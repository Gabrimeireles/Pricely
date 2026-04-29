import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/features/optimization/domain/optimization_result.dart';

void main() {
  test('marks queued optimization results as stale after 30 seconds', () {
    final result = OptimizationResult(
      shoppingListTitle: 'Minha lista',
      generatedAt: DateTime.now().subtract(const Duration(seconds: 31)),
      status: 'queued',
      totalCost: 0,
      estimatedSavings: 0,
      unavailableItems: const <String>[],
      storePlans: const <StoreOptimizationPlan>[],
    );

    expect(result.isStale, isTrue);
  });
}
