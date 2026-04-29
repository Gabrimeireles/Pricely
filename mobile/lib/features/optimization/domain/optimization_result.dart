class OptimizationResult {
  const OptimizationResult({
    required this.shoppingListTitle,
    required this.generatedAt,
    required this.status,
    required this.totalCost,
    required this.estimatedSavings,
    required this.unavailableItems,
    required this.storePlans,
  });

  final String shoppingListTitle;
  final DateTime generatedAt;
  final String status;
  final double totalCost;
  final double estimatedSavings;
  final List<String> unavailableItems;
  final List<StoreOptimizationPlan> storePlans;
  bool get isStale =>
      (status == 'queued' || status == 'running') &&
      DateTime.now().difference(generatedAt).inSeconds > 30;

  factory OptimizationResult.fromJson(Map<String, dynamic> json) {
    return OptimizationResult(
      shoppingListTitle: json['shoppingListTitle'] as String? ?? 'Minha lista',
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      status: json['status'] as String? ?? 'completed',
      totalCost: (json['totalCost'] as num?)?.toDouble() ?? 0,
      estimatedSavings: (json['estimatedSavings'] as num?)?.toDouble() ?? 0,
      unavailableItems:
          (json['unavailableItems'] as List<dynamic>? ?? <dynamic>[])
              .map((item) => item as String)
              .toList(),
      storePlans: (json['storePlans'] as List<dynamic>? ?? <dynamic>[])
          .map(
            (item) =>
                StoreOptimizationPlan.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'shoppingListTitle': shoppingListTitle,
      'generatedAt': generatedAt.toIso8601String(),
      'status': status,
      'totalCost': totalCost,
      'estimatedSavings': estimatedSavings,
      'unavailableItems': unavailableItems,
      'storePlans': storePlans.map((plan) => plan.toJson()).toList(),
    };
  }
}

class StoreOptimizationPlan {
  const StoreOptimizationPlan({
    required this.storeName,
    required this.subtotal,
    required this.selections,
  });

  final String storeName;
  final double subtotal;
  final List<OptimizationSelection> selections;

  factory StoreOptimizationPlan.fromJson(Map<String, dynamic> json) {
    return StoreOptimizationPlan(
      storeName: json['storeName'] as String? ?? 'Loja',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      selections: (json['selections'] as List<dynamic>? ?? <dynamic>[])
          .map(
            (item) =>
                OptimizationSelection.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'storeName': storeName,
      'subtotal': subtotal,
      'selections': selections.map((selection) => selection.toJson()).toList(),
    };
  }
}

class OptimizationSelection {
  const OptimizationSelection({
    required this.itemName,
    required this.storeName,
    required this.quantity,
    required this.unit,
    required this.unitPrice,
    required this.subtotal,
    required this.confidenceLabel,
  });

  final String itemName;
  final String storeName;
  final int quantity;
  final String unit;
  final double unitPrice;
  final double subtotal;
  final String confidenceLabel;

  factory OptimizationSelection.fromJson(Map<String, dynamic> json) {
    return OptimizationSelection(
      itemName: json['itemName'] as String? ?? '',
      storeName: json['storeName'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 1,
      unit: json['unit'] as String? ?? 'un',
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      confidenceLabel: json['confidenceLabel'] as String? ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'itemName': itemName,
      'storeName': storeName,
      'quantity': quantity,
      'unit': unit,
      'unitPrice': unitPrice,
      'subtotal': subtotal,
      'confidenceLabel': confidenceLabel,
    };
  }
}
