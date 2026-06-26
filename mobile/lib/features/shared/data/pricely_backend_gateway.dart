import '../../../core/networking/api_environment.dart';
import '../../../core/networking/http_api_client.dart';
import '../../optimization/domain/optimization_result.dart';
import '../../receipts/domain/receipt_submission.dart';
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

  Future<AuthUser> updatePreferredRegion({
    required String accessToken,
    required String regionSlug,
  }) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      '/auth/preferred-region',
      accessToken: accessToken,
      body: <String, dynamic>{'regionSlug': regionSlug},
    );
    return AuthUser.fromJson(response);
  }

  Future<UserLocationPreferenceSummary> upsertLocationPreference({
    required String accessToken,
    required String regionId,
    required String label,
    required double coverageRadiusKm,
    required bool isDefault,
    required String locationSource,
    double? latitude,
    double? longitude,
    String? postalCode,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/locations',
      accessToken: accessToken,
      body: <String, dynamic>{
        'regionId': regionId,
        'label': label,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (postalCode != null && postalCode.trim().isNotEmpty)
          'postalCode': postalCode.trim(),
        'coverageRadiusKm': coverageRadiusKm,
        'isDefault': isDefault,
        'locationSource': locationSource,
      },
    );
    return UserLocationPreferenceSummary.fromJson(response);
  }

  Future<LocationCoveragePreviewSummary> previewLocationCoverage({
    required String accessToken,
    required String regionId,
    double? latitude,
    double? longitude,
    String? postalCode,
    double coverageRadiusKm = 5,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/locations/coverage-preview',
      accessToken: accessToken,
      body: <String, dynamic>{
        'regionId': regionId,
        'coverageRadiusKm': coverageRadiusKm,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (postalCode != null && postalCode.trim().isNotEmpty)
          'postalCode': postalCode.trim(),
      },
    );
    return LocationCoveragePreviewSummary.fromJson(response);
  }

  Future<List<PushDeviceSummary>> fetchPushDevices(String accessToken) async {
    final response = await _apiClient.get<List<dynamic>>(
      '/notification-push-devices',
      accessToken: accessToken,
    );
    return response
        .map(
          (entry) => PushDeviceSummary.fromJson(entry as Map<String, dynamic>),
        )
        .toList();
  }

  Future<PushDeviceSummary> registerPushDevice({
    required String accessToken,
    required String platform,
    required String deviceToken,
    String provider = 'fcm',
    String? appVersion,
    String? locale,
    String? timezone,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/notification-push-devices',
      accessToken: accessToken,
      body: <String, dynamic>{
        'platform': platform,
        'deviceToken': deviceToken,
        'provider': provider,
        if (appVersion != null) 'appVersion': appVersion,
        if (locale != null) 'locale': locale,
        if (timezone != null) 'timezone': timezone,
      },
    );
    return PushDeviceSummary.fromJson(response);
  }

  Future<PushDeviceSummary> revokePushDevice({
    required String accessToken,
    required String deviceId,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/notification-push-devices/$deviceId/revoke',
      accessToken: accessToken,
    );
    return PushDeviceSummary.fromJson(response);
  }

  List<Map<String, dynamic>> _parseManualReceiptItems(String? rawReceipt) {
    if (rawReceipt == null || rawReceipt.trim().isEmpty) {
      return <Map<String, dynamic>>[];
    }

    return rawReceipt
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .map((line) {
          final parts = line.split(RegExp(r'\s+'));
          final unitPrice = parts.isEmpty
              ? null
              : double.tryParse(parts.last.replaceAll(',', '.'));
          if (unitPrice == null || parts.length < 2) {
            return null;
          }

          final rawProductName = parts.sublist(0, parts.length - 1).join(' ');
          if (rawProductName.trim().isEmpty) {
            return null;
          }

          return <String, dynamic>{
            'rawProductName': rawProductName,
            'quantity': 1,
            'unitPrice': unitPrice,
          };
        })
        .whereType<Map<String, dynamic>>()
        .toList();
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

  Future<ReceiptSubmissionSummary> submitReceipt({
    required String accessToken,
    String? storeName,
    String? qrCodeUrl,
    String? rawReceipt,
  }) async {
    final items = _parseManualReceiptItems(rawReceipt);
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/receipts',
      accessToken: accessToken,
      body: <String, dynamic>{
        if (storeName != null && storeName.trim().isNotEmpty)
          'storeName': storeName.trim(),
        if (qrCodeUrl != null && qrCodeUrl.trim().isNotEmpty)
          'qrCodeUrl': qrCodeUrl.trim(),
        'sourceType': qrCodeUrl != null && qrCodeUrl.trim().isNotEmpty
            ? 'qr_code_url'
            : 'manual_entry',
        if (items.isNotEmpty) 'items': items,
      },
    );

    return ReceiptSubmissionSummary.fromJson(
      response,
      fallbackQrCodeUrl: qrCodeUrl,
    );
  }

  Future<ReceiptSubmissionSummary> fetchReceipt({
    required String accessToken,
    required String receiptId,
    String? fallbackQrCodeUrl,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/receipts/$receiptId',
      accessToken: accessToken,
    );
    return ReceiptSubmissionSummary.fromJson(
      response,
      fallbackQrCodeUrl: fallbackQrCodeUrl,
    );
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

  Future<ShoppingListDraft> updateShoppingListItemPurchaseStatus({
    required String accessToken,
    required String listId,
    required String itemId,
    required String purchaseStatus,
  }) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      '${ApiEnvironment.shoppingListsPath}/$listId/items/$itemId/purchase-status',
      accessToken: accessToken,
      body: <String, dynamic>{'purchaseStatus': purchaseStatus},
    );

    return _mapShoppingList(response);
  }

  Future<OptimizationResult> runOptimization({
    required String accessToken,
    required String listId,
    required String mode,
    String? userLocationPreferenceId,
    double? coverageRadiusKm,
  }) async {
    final body = <String, dynamic>{'mode': mode};
    if (userLocationPreferenceId != null) {
      body['userLocationPreferenceId'] = userLocationPreferenceId;
    }
    if (coverageRadiusKm != null) {
      body['coverageRadiusKm'] = coverageRadiusKm;
    }

    await _apiClient.post<Map<String, dynamic>>(
      '${ApiEnvironment.shoppingListsPath}/$listId/optimize',
      accessToken: accessToken,
      body: body,
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
      regionId: json['preferredRegionId'] as String? ?? '',
      lastMode: json['lastMode'] as String? ?? 'global_multi',
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
          distanceKm: (selection['distanceKm'] as num?)?.toDouble(),
          confidenceLabel:
              selection['confidenceNotice'] as String? ?? 'confirmado',
          decisionReason: selection['decisionReason'] as String?,
          rejectedReason: selection['rejectedReason'] as String?,
          sourceLabel: selection['sourceLabel'] as String?,
          trustFactor: (selection['trustFactor'] as num?)?.toInt(),
          trustLevel: selection['trustLevel'] as String?,
          trustEvidenceCount:
              (selection['trustEvidenceCount'] as num?)?.toInt(),
          trustFreshnessDays:
              (selection['trustFreshnessDays'] as num?)?.toInt(),
          selectedVariantName: selection['selectedVariantName'] as String?,
          selectedPackageLabel: selection['selectedPackageLabel'] as String?,
          confidenceNotice: selection['confidenceNotice'] as String?,
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
    this.productVariants = const <ProductVariantSummary>[],
  });

  final String id;
  final String name;
  final String category;
  final String? defaultUnit;
  final String? imageUrl;
  final List<ProductVariantSummary> productVariants;

  factory CatalogProductSummary.fromJson(Map<String, dynamic> json) {
    return CatalogProductSummary(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Produto',
      category: json['category'] as String? ?? 'geral',
      defaultUnit: json['defaultUnit'] as String?,
      imageUrl: json['imageUrl'] as String?,
      productVariants: (json['productVariants'] as List<dynamic>? ?? <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ProductVariantSummary.fromJson)
          .toList(),
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
    required this.preferredRegionSlug,
    required this.entitlementPlan,
    required this.entitlementStatus,
    required this.availableOptimizationTokens,
    required this.monthlyFreeOptimizationTokens,
    required this.checkoutEnabled,
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
  final String? preferredRegionSlug;
  final String entitlementPlan;
  final String entitlementStatus;
  final int availableOptimizationTokens;
  final int monthlyFreeOptimizationTokens;
  final bool checkoutEnabled;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final profileStats =
        (json['profileStats'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final entitlement =
        (json['entitlement'] as Map<String, dynamic>?) ?? <String, dynamic>{};

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
      preferredRegionSlug: json['preferredRegionSlug'] as String?,
      entitlementPlan: entitlement['plan'] as String? ?? 'free',
      entitlementStatus: entitlement['status'] as String? ?? 'active',
      availableOptimizationTokens:
          (entitlement['availableOptimizationTokens'] as num? ?? 0).toInt(),
      monthlyFreeOptimizationTokens:
          (entitlement['monthlyFreeOptimizationTokens'] as num? ?? 2).toInt(),
      checkoutEnabled: entitlement['checkoutEnabled'] as bool? ?? false,
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

class UserLocationPreferenceSummary {
  UserLocationPreferenceSummary({
    required this.id,
    required this.regionId,
    required this.regionSlug,
    required this.label,
    required this.latitude,
    required this.longitude,
    required this.coverageRadiusKm,
    required this.activeEstablishmentCount,
    required this.isDefault,
    required this.locationSource,
  });

  final String id;
  final String regionId;
  final String regionSlug;
  final String label;
  final double? latitude;
  final double? longitude;
  final double coverageRadiusKm;
  final int activeEstablishmentCount;
  final bool isDefault;
  final String locationSource;

  factory UserLocationPreferenceSummary.fromJson(Map<String, dynamic> json) {
    return UserLocationPreferenceSummary(
      id: json['id'] as String,
      regionId: json['regionId'] as String,
      regionSlug: json['regionSlug'] as String? ?? '',
      label: json['label'] as String? ?? 'Local atual',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      coverageRadiusKm:
          (json['coverageRadiusKm'] as num? ?? 5).toDouble(),
      activeEstablishmentCount:
          (json['activeEstablishmentCount'] as num? ?? 0).toInt(),
      isDefault: json['isDefault'] as bool? ?? false,
      locationSource: json['locationSource'] as String? ?? 'manual',
    );
  }
}

class LocationCoveragePreviewSummary {
  LocationCoveragePreviewSummary({
    required this.regionId,
    required this.coverageRadiusKm,
    required this.activeEstablishmentCount,
    required this.fallbackUsed,
  });

  final String regionId;
  final double coverageRadiusKm;
  final int activeEstablishmentCount;
  final bool fallbackUsed;

  factory LocationCoveragePreviewSummary.fromJson(Map<String, dynamic> json) {
    return LocationCoveragePreviewSummary(
      regionId: json['regionId'] as String? ?? '',
      coverageRadiusKm: (json['coverageRadiusKm'] as num? ?? 5).toDouble(),
      activeEstablishmentCount:
          (json['activeEstablishmentCount'] as num? ?? 0).toInt(),
      fallbackUsed: json['fallbackUsed'] as bool? ?? false,
    );
  }
}

class PushDeviceSummary {
  PushDeviceSummary({
    required this.id,
    required this.platform,
    required this.provider,
    required this.deviceTokenTail,
    required this.isActive,
    required this.lastSeenAt,
    this.appVersion,
    this.locale,
    this.timezone,
    this.revokedAt,
  });

  final String id;
  final String platform;
  final String provider;
  final String deviceTokenTail;
  final bool isActive;
  final String lastSeenAt;
  final String? appVersion;
  final String? locale;
  final String? timezone;
  final String? revokedAt;

  factory PushDeviceSummary.fromJson(Map<String, dynamic> json) {
    return PushDeviceSummary(
      id: json['id'] as String,
      platform: json['platform'] as String? ?? 'android',
      provider: json['provider'] as String? ?? 'fcm',
      deviceTokenTail: json['deviceTokenTail'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? false,
      lastSeenAt: json['lastSeenAt'] as String? ?? '',
      appVersion: json['appVersion'] as String?,
      locale: json['locale'] as String?,
      timezone: json['timezone'] as String?,
      revokedAt: json['revokedAt'] as String?,
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
    this.basePriceAmount,
    this.promotionalPriceAmount,
    this.savingsVsRegionalAverage,
    this.savingsVsComparison,
    required this.observedAt,
    required this.sourceLabel,
    required this.storeName,
    required this.neighborhood,
    required this.confidenceLevel,
    this.imageUrl,
  });

  final String id;
  final String productId;
  final String productName;
  final String displayName;
  final String packageLabel;
  final double priceAmount;
  final double? basePriceAmount;
  final double? promotionalPriceAmount;
  final double? savingsVsRegionalAverage;
  final double? savingsVsComparison;
  final String observedAt;
  final String sourceLabel;
  final String storeName;
  final String neighborhood;
  final String confidenceLevel;
  final String? imageUrl;

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
      basePriceAmount: (json['basePriceAmount'] as num?)?.toDouble(),
      promotionalPriceAmount:
          (json['promotionalPriceAmount'] as num?)?.toDouble(),
      savingsVsRegionalAverage:
          (json['savingsVsRegionalAverage'] as num?)?.toDouble(),
      savingsVsComparison: (json['savingsVsComparison'] as num?)?.toDouble(),
      observedAt: json['observedAt'] as String? ?? '',
      sourceLabel: json['sourceLabel'] as String? ?? 'manual',
      storeName: json['storeName'] as String? ?? 'Loja',
      neighborhood: json['neighborhood'] as String? ?? '',
      confidenceLevel: json['confidenceLevel'] as String? ?? 'medium',
      imageUrl: json['imageUrl'] as String?,
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
          'basePriceAmount': activeOffer['basePriceAmount'],
          'promotionalPriceAmount': activeOffer['promotionalPriceAmount'],
          'savingsVsComparison': activeOffer['savingsVsComparison'],
          'observedAt': activeOffer['observedAt'] ?? '',
          'sourceLabel': activeOffer['sourceLabel'] ?? 'manual',
          'storeName': activeOffer['storeName'] ?? 'Loja',
          'neighborhood': activeOffer['neighborhood'] ?? '',
          'confidenceLevel': activeOffer['confidenceLevel'] ?? 'medium',
          'imageUrl': product['imageUrl'],
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
                'basePriceAmount': entry['basePriceAmount'],
                'promotionalPriceAmount': entry['promotionalPriceAmount'],
                'observedAt': entry['observedAt'] ?? '',
                'sourceLabel': entry['sourceLabel'] ?? 'manual',
                'storeName': entry['storeName'] ?? 'Loja',
                'neighborhood': entry['neighborhood'] ?? '',
                'confidenceLevel': entry['confidenceLevel'] ?? 'medium',
                'imageUrl': product['imageUrl'],
              },
            ),
          )
          .toList(),
    );
  }
}
