import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../../auth/application/auth_controller.dart';
import '../../location/application/mobile_location_controller.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../../shopping_lists/application/shopping_list_controller.dart';
import '../domain/optimization_result.dart';

class OptimizationController extends ChangeNotifier {
  OptimizationController({
    required LocalCacheService cacheService,
    required ShoppingListController shoppingListController,
    required PricelyBackendGateway backendGateway,
    required AuthController authController,
    MobileLocationController? locationController,
  })  : _cacheService = cacheService,
        _shoppingListController = shoppingListController,
        _backendGateway = backendGateway,
        _authController = authController,
        _locationController = locationController;

  final LocalCacheService _cacheService;
  final ShoppingListController _shoppingListController;
  final PricelyBackendGateway _backendGateway;
  final AuthController _authController;
  final MobileLocationController? _locationController;

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
      final mode = activeList.lastMode;
      final locationPreferenceId = _locationController
          ?.preferenceIdForRegionSlug(_shoppingListController.draft.regionId);
      if (_requiresLocation(mode) && locationPreferenceId == null) {
        _errorMessage =
            'Salve sua localizacao para usar modos locais com raio de 5 km.';
        return;
      }

      final result = await _backendGateway.runOptimization(
        accessToken: accessToken,
        listId: _shoppingListController.draft.id!,
        mode: mode,
        userLocationPreferenceId: locationPreferenceId,
        coverageRadiusKm: locationPreferenceId == null ? null : 5,
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

  bool _requiresLocation(String mode) {
    return mode == 'local' ||
        mode == 'local_unique' ||
        mode == 'local_multi';
  }
}
