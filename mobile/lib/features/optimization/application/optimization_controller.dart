import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../../auth/application/auth_controller.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../../shopping_lists/application/shopping_list_controller.dart';
import '../domain/optimization_result.dart';

class OptimizationController extends ChangeNotifier {
  OptimizationController({
    required LocalCacheService cacheService,
    required ShoppingListController shoppingListController,
    required PricelyBackendGateway backendGateway,
    required AuthController authController,
  })  : _cacheService = cacheService,
        _shoppingListController = shoppingListController,
        _backendGateway = backendGateway,
        _authController = authController;

  final LocalCacheService _cacheService;
  final ShoppingListController _shoppingListController;
  final PricelyBackendGateway _backendGateway;
  final AuthController _authController;

  OptimizationResult? _result;
  bool _isLoading = false;
  String? _errorMessage;

  OptimizationResult? get result => _result;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadCachedResult() async {
    _result = await _cacheService.loadOptimizationResult();
    notifyListeners();
  }

  Future<void> optimize() async {
    final accessToken = _authController.accessToken;
    if (accessToken == null) {
      _errorMessage = 'Entre na sua conta para otimizar a lista.';
      notifyListeners();
      return;
    }

    final activeList = _shoppingListController.draft;
    if (activeList.id == null) {
      await _shoppingListController.saveDraft();
    }

    if (_shoppingListController.draft.id == null) {
      _errorMessage = 'Salve a lista antes de rodar a otimizacao.';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _backendGateway.runOptimization(
        accessToken: accessToken,
        listId: _shoppingListController.draft.id!,
        mode: activeList.lastMode,
      );
      _result = result;
      await _cacheService.saveOptimizationResult(result);
      await _authController.refreshProfile();
    } catch (_) {
      _errorMessage = 'Nao foi possivel processar esta lista agora.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
