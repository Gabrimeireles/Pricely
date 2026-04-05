import '../core/storage/key_value_store.dart';
import '../core/storage/local_cache_service.dart';
import '../core/storage/shared_preferences_key_value_store.dart';
import '../features/optimization/application/optimization_controller.dart';
import '../features/optimization/data/demo_grocery_workflow_gateway.dart';
import '../features/receipts/application/receipt_flow_controller.dart';
import '../features/shopping_lists/application/shopping_list_controller.dart';

class AppServices {
  AppServices({
    required this.keyValueStore,
    DemoGroceryWorkflowGateway? workflowGateway,
  })  : workflowGateway = workflowGateway ?? DemoGroceryWorkflowGateway(),
        localCacheService = LocalCacheService(keyValueStore) {
    shoppingListController = ShoppingListController(localCacheService);
    receiptFlowController = ReceiptFlowController(this.workflowGateway);
    optimizationController = OptimizationController(
      cacheService: localCacheService,
      shoppingListController: shoppingListController,
      workflowGateway: this.workflowGateway,
    );
  }

  final KeyValueStore keyValueStore;
  final LocalCacheService localCacheService;
  final DemoGroceryWorkflowGateway workflowGateway;

  late final ShoppingListController shoppingListController;
  late final ReceiptFlowController receiptFlowController;
  late final OptimizationController optimizationController;

  static Future<AppServices> createDefault() async {
    final keyValueStore = await SharedPreferencesKeyValueStore.create();
    final services = AppServices(keyValueStore: keyValueStore);
    await services.initialize();
    return services;
  }

  Future<void> initialize() async {
    await shoppingListController.loadDraft();
    await optimizationController.loadCachedResult();
  }
}
