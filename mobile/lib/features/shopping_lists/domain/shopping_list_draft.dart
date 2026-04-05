class ShoppingListDraft {
  const ShoppingListDraft({
    required this.title,
    required this.items,
  });

  final String title;
  final List<ShoppingListItemDraft> items;

  factory ShoppingListDraft.empty() {
    return const ShoppingListDraft(
      title: 'Lista da semana',
      items: <ShoppingListItemDraft>[],
    );
  }

  factory ShoppingListDraft.fromJson(Map<String, dynamic> json) {
    return ShoppingListDraft(
      title: json['title'] as String? ?? 'Lista da semana',
      items: (json['items'] as List<dynamic>? ?? <dynamic>[])
          .map((item) =>
              ShoppingListItemDraft.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  ShoppingListDraft copyWith({
    String? title,
    List<ShoppingListItemDraft>? items,
  }) {
    return ShoppingListDraft(
      title: title ?? this.title,
      items: items ?? this.items,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'title': title,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

class ShoppingListItemDraft {
  const ShoppingListItemDraft({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unit,
  });

  final String id;
  final String name;
  final int quantity;
  final String unit;

  factory ShoppingListItemDraft.fromJson(Map<String, dynamic> json) {
    return ShoppingListItemDraft(
      id: json['id'] as String,
      name: json['name'] as String,
      quantity: json['quantity'] as int? ?? 1,
      unit: json['unit'] as String? ?? 'un',
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'quantity': quantity,
      'unit': unit,
    };
  }
}
