class ShoppingListDraft {
  const ShoppingListDraft({
    required this.id,
    required this.title,
    required this.regionId,
    required this.lastMode,
    required this.items,
  });

  final String? id;
  final String title;
  final String regionId;
  final String lastMode;
  final List<ShoppingListItemDraft> items;

  factory ShoppingListDraft.empty() {
    return const ShoppingListDraft(
      id: null,
      title: 'Lista da semana',
      regionId: 'sao-paulo-sp',
      lastMode: 'global_full',
      items: <ShoppingListItemDraft>[],
    );
  }

  factory ShoppingListDraft.fromJson(Map<String, dynamic> json) {
    return ShoppingListDraft(
      id: json['id'] as String?,
      title: json['title'] as String? ?? 'Lista da semana',
      regionId: json['regionId'] as String? ?? 'sao-paulo-sp',
      lastMode: json['lastMode'] as String? ?? 'global_full',
      items: (json['items'] as List<dynamic>? ?? <dynamic>[])
          .map((item) =>
              ShoppingListItemDraft.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  ShoppingListDraft copyWith({
    String? id,
    String? title,
    String? regionId,
    String? lastMode,
    List<ShoppingListItemDraft>? items,
  }) {
    return ShoppingListDraft(
      id: id ?? this.id,
      title: title ?? this.title,
      regionId: regionId ?? this.regionId,
      lastMode: lastMode ?? this.lastMode,
      items: items ?? this.items,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'title': title,
      'regionId': regionId,
      'lastMode': lastMode,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

class ShoppingListItemDraft {
  const ShoppingListItemDraft({
    required this.id,
    required this.name,
    this.catalogProductId,
    this.lockedProductVariantId,
    this.brandPreferenceMode = 'any',
    this.preferredBrandNames = const <String>[],
    this.imageUrl,
    required this.quantity,
    required this.unit,
    this.note,
    this.purchaseStatus = 'pending',
  });

  final String id;
  final String name;
  final String? catalogProductId;
  final String? lockedProductVariantId;
  final String brandPreferenceMode;
  final List<String> preferredBrandNames;
  final String? imageUrl;
  final int quantity;
  final String unit;
  final String? note;
  final String purchaseStatus;

  factory ShoppingListItemDraft.fromJson(Map<String, dynamic> json) {
    return ShoppingListItemDraft(
      id: json['id'] as String,
      name: json['name'] as String,
      catalogProductId: json['catalogProductId'] as String?,
      lockedProductVariantId: json['lockedProductVariantId'] as String?,
      brandPreferenceMode: json['brandPreferenceMode'] as String? ?? 'any',
      preferredBrandNames:
          (json['preferredBrandNames'] as List<dynamic>? ?? <dynamic>[])
              .map((item) => item as String)
              .toList(),
      imageUrl: json['imageUrl'] as String?,
      quantity: json['quantity'] as int? ?? 1,
      unit: json['unit'] as String? ?? 'un',
      note: json['note'] as String?,
      purchaseStatus: json['purchaseStatus'] as String? ?? 'pending',
    );
  }

  ShoppingListItemDraft copyWith({
    String? id,
    String? name,
    String? catalogProductId,
    String? lockedProductVariantId,
    String? brandPreferenceMode,
    List<String>? preferredBrandNames,
    String? imageUrl,
    int? quantity,
    String? unit,
    String? note,
    String? purchaseStatus,
  }) {
    return ShoppingListItemDraft(
      id: id ?? this.id,
      name: name ?? this.name,
      catalogProductId: catalogProductId ?? this.catalogProductId,
      lockedProductVariantId:
          lockedProductVariantId ?? this.lockedProductVariantId,
      brandPreferenceMode: brandPreferenceMode ?? this.brandPreferenceMode,
      preferredBrandNames: preferredBrandNames ?? this.preferredBrandNames,
      imageUrl: imageUrl ?? this.imageUrl,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      note: note ?? this.note,
      purchaseStatus: purchaseStatus ?? this.purchaseStatus,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'catalogProductId': catalogProductId,
      'lockedProductVariantId': lockedProductVariantId,
      'brandPreferenceMode': brandPreferenceMode,
      'preferredBrandNames': preferredBrandNames,
      'imageUrl': imageUrl,
      'quantity': quantity,
      'unit': unit,
      'note': note,
      'purchaseStatus': purchaseStatus,
    };
  }
}
