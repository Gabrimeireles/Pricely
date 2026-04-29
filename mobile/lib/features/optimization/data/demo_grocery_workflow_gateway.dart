import '../../receipts/domain/receipt_submission.dart';
import '../../shopping_lists/domain/shopping_list_draft.dart';
import '../domain/optimization_result.dart';

class DemoGroceryWorkflowGateway {
  final Map<String, List<_DemoStoreOffer>> _offersByItem =
      <String, List<_DemoStoreOffer>>{};

  Future<ReceiptSubmissionSummary> submitReceipt({
    required String storeName,
    required String rawReceipt,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    final lines = rawReceipt
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    final lowConfidenceItems = <String>[];
    var ingestedItems = 0;

    for (final line in lines) {
      final parsedLine = _parseReceiptLine(line);
      if (parsedLine == null) {
        lowConfidenceItems.add(line);
        continue;
      }

      final slug = _slugify(parsedLine.itemName);
      _offersByItem.putIfAbsent(slug, () => <_DemoStoreOffer>[]);
      _offersByItem[slug]!.add(
        _DemoStoreOffer(
          storeName: storeName,
          unitPrice: parsedLine.unitPrice,
        ),
      );
      ingestedItems += 1;
    }

    return ReceiptSubmissionSummary(
      storeName: storeName,
      ingestedItems: ingestedItems,
      lowConfidenceItems: lowConfidenceItems,
    );
  }

  Future<OptimizationResult> optimizeShoppingList(
      ShoppingListDraft draft) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));

    final selections = <OptimizationSelection>[];
    final unavailableItems = <String>[];

    for (final item in draft.items) {
      final slug = _slugify(item.name);
      final offers = _offersByItem[slug];

      if (offers == null || offers.isEmpty) {
        unavailableItems.add(item.name);
        continue;
      }

      offers.sort((left, right) => left.unitPrice.compareTo(right.unitPrice));
      final cheapestOffer = offers.first;
      final quantity = item.quantity <= 0 ? 1 : item.quantity;

      selections.add(
        OptimizationSelection(
          itemName: item.name,
          storeName: cheapestOffer.storeName,
          quantity: quantity,
          unit: item.unit,
          unitPrice: cheapestOffer.unitPrice,
          subtotal: cheapestOffer.unitPrice * quantity,
          confidenceLabel: offers.length > 1 ? 'high' : 'medium',
        ),
      );
    }

    final storePlansMap = <String, List<OptimizationSelection>>{};
    for (final selection in selections) {
      storePlansMap.putIfAbsent(
          selection.storeName, () => <OptimizationSelection>[]);
      storePlansMap[selection.storeName]!.add(selection);
    }

    final storePlans = storePlansMap.entries
        .map(
          (entry) => StoreOptimizationPlan(
            storeName: entry.key,
            subtotal: entry.value.fold<double>(
              0,
              (current, selection) => current + selection.subtotal,
            ),
            selections: entry.value,
          ),
        )
        .toList()
      ..sort((left, right) => left.storeName.compareTo(right.storeName));

    final totalCost = storePlans.fold<double>(
      0,
      (current, plan) => current + plan.subtotal,
    );

    final estimatedSavings = selections.isEmpty
        ? 0.0
        : selections.fold<double>(
              0,
              (current, selection) => current + (selection.unitPrice * 0.18),
            ) /
            2;

    return OptimizationResult(
      shoppingListTitle: draft.title,
      generatedAt: DateTime.now(),
      status: 'completed',
      totalCost: totalCost,
      estimatedSavings: estimatedSavings,
      unavailableItems: unavailableItems,
      storePlans: storePlans,
    );
  }

  _ParsedReceiptLine? _parseReceiptLine(String line) {
    final parts = line.split(RegExp(r'\s+'));
    if (parts.length < 2) {
      return null;
    }

    final unitPrice = double.tryParse(parts.last.replaceAll(',', '.'));
    if (unitPrice == null) {
      return null;
    }

    final itemName = parts.sublist(0, parts.length - 1).join(' ').trim();
    if (itemName.isEmpty) {
      return null;
    }

    return _ParsedReceiptLine(itemName: itemName, unitPrice: unitPrice);
  }

  String _slugify(String value) {
    return value.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
  }
}

class _ParsedReceiptLine {
  const _ParsedReceiptLine({
    required this.itemName,
    required this.unitPrice,
  });

  final String itemName;
  final double unitPrice;
}

class _DemoStoreOffer {
  const _DemoStoreOffer({
    required this.storeName,
    required this.unitPrice,
  });

  final String storeName;
  final double unitPrice;
}
