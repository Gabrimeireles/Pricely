import '../../../core/networking/api_environment.dart';
import '../../../core/networking/http_api_client.dart';
import '../../optimization/domain/optimization_result.dart';
import '../../shopping_lists/domain/shopping_list_draft.dart';

class PricelyBackendGateway {
  PricelyBackendGateway(this._apiClient);

  final HttpApiClient _apiClient;

  Future<AuthSession> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiEnvironment.loginPath,
      body: <String, dynamic>{
        'email': email,
        'password': password,
      },
    );
    return AuthSession.fromJson(response);
  }

  Future<AuthSession> register({
    required String displayName,
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiEnvironment.registerPath,
      body: <String, dynamic>{
        'displayName': displayName,
        'email': email,
        'password': password,
      },
    );
    return AuthSession.fromJson(response);
  }

  Future<AuthUser> fetchProfile(String accessToken) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiEnvironment.profilePath,
      accessToken: accessToken,
    );
    return AuthUser.fromJson(response);
  }

  Future<List<PublicRegionSummary>> fetchPublicRegions() async {
    final response = await _apiClient.get<List<dynamic>>('/regions');
    return response
        .map((entry) =>
            PublicRegionSummary.fromJson(entry as Map<String, dynamic>))
        .toList();
  }

  Future<List<CatalogProductSummary>> searchCatalogProducts(String query) async {
    final response = await _apiClient.get<List<dynamic>>(
      '/catalog-products/search?q=${Uri.encodeQueryComponent(query)}',
    );

    return response
        .map((entry) =>
            CatalogProductSummary.fromJson(entry as Map<String, dynamic>))
        .toList();
  }

  Future<List<ProductVariantSummary>> fetchCatalogProductVariants(
    String catalogProductId,
  ) async {
    final response = await _apiClient.get<List<dynamic>>(
      '/catalog-products/$catalogProductId/variants',
    );

    return response
        .map((entry) =>
            ProductVariantSummary.fromJson(entry as Map<String, dynamic>))
        .toList();
  }

  Future<List<PublicOfferSummary>> fetchRegionOffers(String regionSlug) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/regions/$regionSlug/offers',
    );
    final offers = (response['offers'] as List<dynamic>? ?? <dynamic>[])
        .cast<Map<String, dynamic>>();
    return offers.map((entry) => PublicOfferSummary.fromJson(entry)).toList();
  }

  Future<PublicOfferDetail> fetchOfferDetail(String offerId) async {
    final response =
        await _apiClient.get<Map<String, dynamic>>('/offers/$offerId');
    return PublicOfferDetail.fromJson(response);
  }

  Future<List<ShoppingListDraft>> fetchShoppingLists(String accessToken) async {
    final response = await _apiClient.get<List<dynamic>>(
      ApiEnvironment.shoppingListsPath,
      accessToken: accessToken,
    );

    return response
        .map((entry) => _mapShoppingList(entry as Map<String, dynamic>))
        .toList();
  }

  Future<ShoppingListDraft> createShoppingList({
    required String accessToken,
    required ShoppingListDraft draft,
  }) async {
    final created = await _apiClient.post<Map<String, dynamic>>(
      ApiEnvironment.shoppingListsPath,
      accessToken: accessToken,
      body: <String, dynamic>{
        'name': draft.title,
        'preferredRegionId': draft.regionId,
        'lastMode': draft.lastMode,
      },
    );

    return updateShoppingList(
      accessToken: accessToken,
      listId: created['id'] as String,
      draft: draft.copyWith(id: created['id'] as String),
    );
  }

  Future<ShoppingListDraft> updateShoppingList({
    required String accessToken,
    required String listId,
    required ShoppingListDraft draft,
  }) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      '${ApiEnvironment.shoppingListsPath}/$listId',
      accessToken: accessToken,
      body: <String, dynamic>{
        'name': draft.title,
        'preferredRegionId': draft.regionId,
        'lastMode': draft.lastMode,
        'items': draft.items
            .map(
              (item) => <String, dynamic>{
                'requestedName': item.name,
                'catalogProductId': item.catalogProductId,
                'lockedProductVariantId': item.lockedProductVariantId,
                'brandPreferenceMode': item.brandPreferenceMode,
                'preferredBrandNames': item.preferredBrandNames,
                'purchaseStatus': item.purchaseStatus,
                'quantity': item.quantity,
                'unitLabel': item.unit,
                'notes': item.note,
              },
            )
            .toList(),
      },
    );

    return _mapShoppingList(response);
  }

  Future<OptimizationResult> runOptimization({
    required String accessToken,
    required String listId,
    required String mode,
  }) async {
    await _apiClient.post<Map<String, dynamic>>(
      '${ApiEnvironment.shoppingListsPath}/$listId/optimize',
      accessToken: accessToken,
      body: <String, dynamic>{'mode': mode},
    );
    return _waitForOptimizationResult(
      accessToken: accessToken,
      listId: listId,
    );
  }

  Future<OptimizationResult> _waitForOptimizationResult({
    required String accessToken,
    required String listId,
  }) async {
    final deadline = DateTime.now().add(const Duration(seconds: 30));
    var latest = await _apiClient.get<Map<String, dynamic>>(
      '${ApiEnvironment.shoppingListsPath}/$listId/optimizations/latest',
      accessToken: accessToken,
    );

    while (latest['status'] != 'completed' &&
        latest['status'] != 'failed' &&
        DateTime.now().isBefore(deadline)) {
      await Future<void>.delayed(const Duration(seconds: 1));
      latest = await _apiClient.get<Map<String, dynamic>>(
        '${ApiEnvironment.shoppingListsPath}/$listId/optimizations/latest',
        accessToken: accessToken,
      );
    }

    if (latest['status'] == 'failed') {
      throw StateError(
        latest['explanationSummary'] as String? ??
            'Nao foi possivel processar esta lista.',
      );
    }

    return _mapOptimizationResult(latest);
  }

  ShoppingListDraft _mapShoppingList(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? <dynamic>[])
        .cast<Map<String, dynamic>>();

    return ShoppingListDraft(
      id: json['id'] as String,
      title: json['name'] as String? ?? 'Minha lista',
      regionId: json['preferredRegionId'] as String? ?? 'sao-paulo-sp',
      lastMode: json['lastMode'] as String? ?? 'global_full',
      items: items
          .map(
            (item) => ShoppingListItemDraft(
              id: item['id'] as String,
              name: item['requestedName'] as String? ?? '',
              catalogProductId: item['catalogProductId'] as String?,
              lockedProductVariantId:
                  item['lockedProductVariantId'] as String?,
              brandPreferenceMode:
                  item['brandPreferenceMode'] as String? ?? 'any',
              preferredBrandNames:
                  (item['preferredBrandNames'] as List<dynamic>? ??
                          <dynamic>[])
                      .map((entry) => entry as String)
                      .toList(),
              imageUrl: item['imageUrl'] as String?,
              quantity: _parseInt(item['quantity']),
              unit: item['unitLabel'] as String? ?? 'un',
              note: item['notes'] as String?,
              purchaseStatus: item['purchaseStatus'] as String? ?? 'pending',
            ),
          )
          .toList(),
    );
  }

  OptimizationResult _mapOptimizationResult(Map<String, dynamic> json) {
    final selections = (json['selections'] as List<dynamic>? ?? <dynamic>[])
        .cast<Map<String, dynamic>>();
    final selected = selections
        .where((selection) => selection['selectionStatus'] == 'selected')
        .toList();

    final grouped = <String, List<OptimizationSelection>>{};
    for (final selection in selected) {
      final storeName = selection['establishmentName'] as String? ?? 'Loja';
      final priceAmount =
          (selection['priceAmount'] ?? selection['estimatedCost'] ?? 0) as num;
      final shoppingListItemName =
          selection['shoppingListItemName'] as String? ?? 'Item';

      grouped.putIfAbsent(storeName, () => <OptimizationSelection>[]);
      grouped[storeName]!.add(
        OptimizationSelection(
          itemName: shoppingListItemName,
          storeName: storeName,
          quantity: 1,
          unit: 'un',
          unitPrice: priceAmount.toDouble(),
          subtotal: priceAmount.toDouble(),
          confidenceLabel:
              selection['confidenceNotice'] as String? ?? 'confirmado',
        ),
      );
    }

    final unavailableItems = selections
        .where((selection) => selection['selectionStatus'] != 'selected')
        .map((selection) =>
            selection['shoppingListItemName'] as String? ?? 'Item')
        .toList();

    return OptimizationResult(
      shoppingListTitle: json['shoppingListTitle'] as String? ?? 'Minha lista',
      generatedAt: DateTime.tryParse(json['completedAt'] as String? ?? '') ??
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      status: json['status'] as String? ?? 'completed',
      totalCost: ((json['totalEstimatedCost'] ?? 0) as num).toDouble(),
      estimatedSavings: ((json['estimatedSavings'] ?? 0) as num).toDouble(),
      unavailableItems: unavailableItems,
      storePlans: grouped.entries
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
          .toList(),
    );
  }

  int _parseInt(Object? value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    if (value is String) {
      return int.tryParse(value) ?? 1;
    }
    return 1;
  }
}

class CatalogProductSummary {
  CatalogProductSummary({
    required this.id,
    required this.name,
    required this.category,
    this.defaultUnit,
    this.imageUrl,
  });

  final String id;
  final String name;
  final String category;
  final String? defaultUnit;
  final String? imageUrl;

  factory CatalogProductSummary.fromJson(Map<String, dynamic> json) {
    return CatalogProductSummary(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Produto',
      category: json['category'] as String? ?? 'geral',
      defaultUnit: json['defaultUnit'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

class ProductVariantSummary {
  ProductVariantSummary({
    required this.id,
    required this.catalogProductId,
    required this.displayName,
    this.brandName,
    this.packageLabel,
    this.imageUrl,
  });

  final String id;
  final String catalogProductId;
  final String displayName;
  final String? brandName;
  final String? packageLabel;
  final String? imageUrl;

  factory ProductVariantSummary.fromJson(Map<String, dynamic> json) {
    return ProductVariantSummary(
      id: json['id'] as String,
      catalogProductId: json['catalogProductId'] as String? ?? '',
      displayName: json['displayName'] as String? ?? 'Variante',
      brandName: json['brandName'] as String?,
      packageLabel: json['packageLabel'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

class AuthSession {
  AuthSession({
    required this.accessToken,
    required this.user,
  });

  final String accessToken;
  final AuthUser user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: json['accessToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class AuthUser {
  AuthUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
    required this.shoppingListsCount,
    required this.completedOptimizationRuns,
    required this.contributionsCount,
    required this.receiptSubmissionsCount,
    required this.offerReportsCount,
    required this.totalEstimatedSavings,
  });

  final String id;
  final String email;
  final String displayName;
  final String role;
  final int shoppingListsCount;
  final int completedOptimizationRuns;
  final int contributionsCount;
  final int receiptSubmissionsCount;
  final int offerReportsCount;
  final double totalEstimatedSavings;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final profileStats =
        (json['profileStats'] as Map<String, dynamic>?) ?? <String, dynamic>{};

    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String? ?? 'Cliente Pricely',
      role: json['role'] as String? ?? 'customer',
      shoppingListsCount:
          (profileStats['shoppingListsCount'] as num? ?? 0).toInt(),
      completedOptimizationRuns:
          (profileStats['completedOptimizationRuns'] as num? ?? 0).toInt(),
      contributionsCount:
          (profileStats['contributionsCount'] as num? ?? 0).toInt(),
      receiptSubmissionsCount:
          (profileStats['receiptSubmissionsCount'] as num? ?? 0).toInt(),
      offerReportsCount:
          (profileStats['offerReportsCount'] as num? ?? 0).toInt(),
      totalEstimatedSavings:
          (profileStats['totalEstimatedSavings'] as num? ?? 0).toDouble(),
    );
  }
}

class PublicRegionSummary {
  PublicRegionSummary({
    required this.id,
    required this.slug,
    required this.name,
    required this.stateCode,
    required this.implantationStatus,
    required this.activeEstablishmentCount,
    required this.offerCoverageStatus,
  });

  final String id;
  final String slug;
  final String name;
  final String stateCode;
  final String implantationStatus;
  final int activeEstablishmentCount;
  final String offerCoverageStatus;

  factory PublicRegionSummary.fromJson(Map<String, dynamic> json) {
    return PublicRegionSummary(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      stateCode: json['stateCode'] as String,
      implantationStatus: json['implantationStatus'] as String? ?? 'active',
      activeEstablishmentCount:
          (json['activeEstablishmentCount'] as num? ?? 0).toInt(),
      offerCoverageStatus:
          json['offerCoverageStatus'] as String? ?? 'collecting_data',
    );
  }
}

class PublicOfferSummary {
  PublicOfferSummary({
    required this.id,
    required this.productId,
    required this.productName,
    required this.displayName,
    required this.packageLabel,
    required this.priceAmount,
    required this.observedAt,
    required this.sourceLabel,
    required this.storeName,
    required this.neighborhood,
    required this.confidenceLevel,
  });

  final String id;
  final String productId;
  final String productName;
  final String displayName;
  final String packageLabel;
  final double priceAmount;
  final String observedAt;
  final String sourceLabel;
  final String storeName;
  final String neighborhood;
  final String confidenceLevel;

  factory PublicOfferSummary.fromJson(Map<String, dynamic> json) {
    return PublicOfferSummary(
      id: json['id'] as String,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ??
          json['displayName'] as String? ??
          'Produto',
      displayName: json['displayName'] as String? ??
          json['productName'] as String? ??
          'Oferta',
      packageLabel: json['packageLabel'] as String? ?? '',
      priceAmount: (json['priceAmount'] as num? ?? 0).toDouble(),
      observedAt: json['observedAt'] as String? ?? '',
      sourceLabel: json['sourceLabel'] as String? ?? 'manual',
      storeName: json['storeName'] as String? ?? 'Loja',
      neighborhood: json['neighborhood'] as String? ?? '',
      confidenceLevel: json['confidenceLevel'] as String? ?? 'medium',
    );
  }
}

class PublicOfferDetail {
  PublicOfferDetail({
    required this.id,
    required this.productName,
    required this.category,
    required this.activeOffer,
    required this.alternativeOffers,
  });

  final String id;
  final String productName;
  final String category;
  final PublicOfferSummary activeOffer;
  final List<PublicOfferSummary> alternativeOffers;

  factory PublicOfferDetail.fromJson(Map<String, dynamic> json) {
    final product =
        (json['product'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final activeOffer =
        (json['activeOffer'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final alternativeOffers =
        (json['alternativeOffers'] as List<dynamic>? ?? <dynamic>[])
            .cast<Map<String, dynamic>>();

    return PublicOfferDetail(
      id: json['id'] as String,
      productName: product['name'] as String? ?? 'Produto',
      category: product['category'] as String? ?? 'geral',
      activeOffer: PublicOfferSummary.fromJson(
        <String, dynamic>{
          'id': activeOffer['id'] ?? json['id'],
          'productId': product['id'] ?? '',
          'productName': product['name'] ?? 'Produto',
          'displayName':
              activeOffer['displayName'] ?? product['name'] ?? 'Oferta',
          'packageLabel': activeOffer['packageLabel'] ?? '',
          'priceAmount': activeOffer['priceAmount'] ?? 0,
          'observedAt': activeOffer['observedAt'] ?? '',
          'sourceLabel': activeOffer['sourceLabel'] ?? 'manual',
          'storeName': activeOffer['storeName'] ?? 'Loja',
          'neighborhood': activeOffer['neighborhood'] ?? '',
          'confidenceLevel': activeOffer['confidenceLevel'] ?? 'medium',
        },
      ),
      alternativeOffers: alternativeOffers
          .map(
            (entry) => PublicOfferSummary.fromJson(
              <String, dynamic>{
                'id': entry['id'],
                'productId': product['id'] ?? '',
                'productName': product['name'] ?? 'Produto',
                'displayName': product['name'] ?? 'Oferta',
                'packageLabel': entry['packageLabel'] ?? '',
                'priceAmount': entry['priceAmount'] ?? 0,
                'observedAt': entry['observedAt'] ?? '',
                'sourceLabel': entry['sourceLabel'] ?? 'manual',
                'storeName': entry['storeName'] ?? 'Loja',
                'neighborhood': entry['neighborhood'] ?? '',
                'confidenceLevel': entry['confidenceLevel'] ?? 'medium',
              },
            ),
          )
          .toList(),
    );
  }
}
