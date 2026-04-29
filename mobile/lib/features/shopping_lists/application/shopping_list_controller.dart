import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../../auth/application/auth_controller.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../domain/shopping_list_draft.dart';

class ShoppingListController extends ChangeNotifier {
  ShoppingListController({
    required LocalCacheService cacheService,
    required AuthController authController,
    required PricelyBackendGateway backendGateway,
  })  : _cacheService = cacheService,
        _authController = authController,
        _backendGateway = backendGateway {
    _authController.addListener(_handleAuthChanged);
  }

  final LocalCacheService _cacheService;
  final AuthController _authController;
  final PricelyBackendGateway _backendGateway;

  ShoppingListDraft _draft = ShoppingListDraft.empty();
  List<ShoppingListDraft> _lists = <ShoppingListDraft>[];
  bool _isReady = false;
  bool _isSyncing = false;
  String? _errorMessage;
  List<CatalogProductSummary> _catalogResults = <CatalogProductSummary>[];
  List<ProductVariantSummary> _variantResults = <ProductVariantSummary>[];

  ShoppingListDraft get draft => _draft;
  List<ShoppingListDraft> get lists => _lists;
  bool get isReady => _isReady;
  bool get isSyncing => _isSyncing;
  String? get errorMessage => _errorMessage;
  List<CatalogProductSummary> get catalogResults => _catalogResults;
  List<ProductVariantSummary> get variantResults => _variantResults;

  Future<void> loadDraft() async {
    if (!_authController.isAuthenticated) {
      _draft = await _cacheService.loadShoppingListDraft() ??
          ShoppingListDraft.empty();
      _lists = _draft.id == null ? <ShoppingListDraft>[] : <ShoppingListDraft>[_draft];
      _isReady = true;
      notifyListeners();
      return;
    }

    await reloadRemoteLists();
  }

  Future<void> reloadRemoteLists() async {
    final accessToken = _authController.accessToken;
    if (accessToken == null) {
      return;
    }

    _isSyncing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final remoteLists = await _backendGateway.fetchShoppingLists(accessToken);
      _lists = remoteLists;
      _draft = remoteLists.isEmpty ? ShoppingListDraft.empty() : remoteLists.first;
      await _cacheService.saveShoppingListDraft(_draft);
    } catch (_) {
      _errorMessage = 'Nao foi possivel carregar suas listas.';
    } finally {
      _isReady = true;
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> startNewList() async {
    _draft = ShoppingListDraft.empty();
    await _persistLocal();
  }

  Future<void> selectList(String? listId) async {
    if (listId == null) {
      return;
    }

    final selected = _lists.where((list) => list.id == listId);
    if (selected.isEmpty) {
      return;
    }

    _draft = selected.first;
    await _persistLocal();
  }

  Future<void> updateTitle(String title) async {
    _draft = _draft.copyWith(title: title);
    await _persistLocal();
  }

  Future<void> updateRegionId(String regionId) async {
    _draft = _draft.copyWith(regionId: regionId);
    await _persistLocal();
  }

  Future<void> updateMode(String mode) async {
    _draft = _draft.copyWith(lastMode: mode);
    await _persistLocal();
  }

  Future<void> addItem({
    required String name,
    String? catalogProductId,
    String? lockedProductVariantId,
    String brandPreferenceMode = 'any',
    List<String> preferredBrandNames = const <String>[],
    String? imageUrl,
    int quantity = 1,
    String unit = 'un',
    String? note,
  }) async {
    if (name.trim().isEmpty) {
      return;
    }

    final nextItems = List<ShoppingListItemDraft>.from(_draft.items)
      ..add(
        ShoppingListItemDraft(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          name: name.trim(),
          catalogProductId: catalogProductId,
          lockedProductVariantId: lockedProductVariantId,
          brandPreferenceMode: brandPreferenceMode,
          preferredBrandNames: preferredBrandNames,
          imageUrl: imageUrl,
          quantity: quantity,
          unit: unit,
          note: note,
        ),
      );

    _draft = _draft.copyWith(items: nextItems);
    await _persistLocal();
  }

  Future<void> removeItem(String itemId) async {
    _draft = _draft.copyWith(
      items: _draft.items.where((item) => item.id != itemId).toList(),
    );
    await _persistLocal();
  }

  Future<void> togglePurchased(String itemId) async {
    ShoppingListItemDraft? currentItem;
    for (final item in _draft.items) {
      if (item.id == itemId) {
        currentItem = item;
        break;
      }
    }
    if (currentItem == null) {
      return;
    }

    final nextStatus =
        currentItem.purchaseStatus == 'purchased' ? 'pending' : 'purchased';
    final accessToken = _authController.accessToken;

    if (accessToken != null && _draft.id != null) {
      try {
        final updated = await _backendGateway.updateShoppingListItemPurchaseStatus(
          accessToken: accessToken,
          listId: _draft.id!,
          itemId: itemId,
          purchaseStatus: nextStatus,
        );
        _draft = updated;
        _lists = _lists
            .map((list) => list.id == updated.id ? updated : list)
            .toList();
        await _cacheService.saveShoppingListDraft(_draft);
        notifyListeners();
        return;
      } catch (_) {
        _errorMessage = 'Nao foi possivel atualizar o checklist.';
      }
    }

    _draft = _draft.copyWith(
      items: _draft.items
          .map(
            (item) => item.id == itemId
                ? item.copyWith(purchaseStatus: nextStatus)
                : item,
          )
          .toList(),
    );
    await _persistLocal();
  }

  Future<void> searchCatalog(String query) async {
    if (query.trim().length < 2) {
      _catalogResults = <CatalogProductSummary>[];
      notifyListeners();
      return;
    }

    _catalogResults = await _backendGateway.searchCatalogProducts(query.trim());
    notifyListeners();
  }

  Future<void> loadVariants(String catalogProductId) async {
    _variantResults =
        await _backendGateway.fetchCatalogProductVariants(catalogProductId);
    notifyListeners();
  }

  Future<void> saveDraft() async {
    final accessToken = _authController.accessToken;
    if (accessToken == null) {
      await _persistLocal();
      return;
    }

    _isSyncing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final saved = _draft.id == null
          ? await _backendGateway.createShoppingList(
              accessToken: accessToken,
              draft: _draft,
            )
          : await _backendGateway.updateShoppingList(
              accessToken: accessToken,
              listId: _draft.id!,
              draft: _draft,
            );

      _draft = saved;
      final existingIndex = _lists.indexWhere((entry) => entry.id == saved.id);
      if (existingIndex == -1) {
        _lists = <ShoppingListDraft>[saved, ..._lists];
      } else {
        final nextLists = List<ShoppingListDraft>.from(_lists);
        nextLists[existingIndex] = saved;
        _lists = nextLists;
      }

      await _cacheService.saveShoppingListDraft(_draft);
      await _authController.refreshProfile();
    } catch (_) {
      _errorMessage = 'Nao foi possivel salvar sua lista.';
      rethrow;
    } finally {
      _isSyncing = false;
      _isReady = true;
      notifyListeners();
    }
  }

  Future<void> _persistLocal() async {
    await _cacheService.saveShoppingListDraft(_draft);
    notifyListeners();
  }

  Future<void> _handleAuthChanged() async {
    if (!_authController.isReady) {
      return;
    }

    await loadDraft();
  }
}
