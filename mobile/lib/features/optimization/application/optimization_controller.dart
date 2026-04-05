import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../../shopping_lists/application/shopping_list_controller.dart';
import '../data/demo_grocery_workflow_gateway.dart';
import '../domain/optimization_result.dart';

class OptimizationController extends ChangeNotifier {
  OptimizationController({
    required LocalCacheService cacheService,
    required ShoppingListController shoppingListController,
    required DemoGroceryWorkflowGateway workflowGateway,
  })  : _cacheService = cacheService,
        _shoppingListController = shoppingListController,
        _workflowGateway = workflowGateway;

  final LocalCacheService _cacheService;
  final ShoppingListController _shoppingListController;
  final DemoGroceryWorkflowGateway _workflowGateway;

  OptimizationResult? _result;
  bool _isLoading = false;

  OptimizationResult? get result => _result;
  bool get isLoading => _isLoading;

  Future<void> loadCachedResult() async {
    _result = await _cacheService.loadOptimizationResult();
    notifyListeners();
  }

  Future<void> optimize() async {
    _isLoading = true;
    notifyListeners();

    final result = await _workflowGateway
        .optimizeShoppingList(_shoppingListController.draft);
    _result = result;
    _isLoading = false;

    await _cacheService.saveOptimizationResult(result);
    notifyListeners();
  }
}
