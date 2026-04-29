import '../core/networking/http_api_client.dart';
import '../core/storage/key_value_store.dart';
import '../core/storage/local_cache_service.dart';
import '../core/storage/shared_preferences_key_value_store.dart';
import '../features/auth/application/auth_controller.dart';
import '../features/discovery/application/market_discovery_controller.dart';
import '../features/optimization/application/optimization_controller.dart';
import '../features/optimization/data/demo_grocery_workflow_gateway.dart';
import '../features/receipts/application/receipt_flow_controller.dart';
import '../features/shared/data/pricely_backend_gateway.dart';
import '../features/shopping_lists/application/shopping_list_controller.dart';

class AppServices {
  AppServices._({
    required this.keyValueStore,
    required this.apiClient,
    required this.workflowGateway,
  })  : localCacheService = LocalCacheService(keyValueStore),
        backendGateway = PricelyBackendGateway(apiClient) {
    authController = AuthController(
      cacheService: localCacheService,
      backendGateway: backendGateway,
    );
    marketDiscoveryController = MarketDiscoveryController(backendGateway);
    shoppingListController = ShoppingListController(
      cacheService: localCacheService,
      authController: authController,
      backendGateway: backendGateway,
    );
    receiptFlowController = ReceiptFlowController(workflowGateway);
    optimizationController = OptimizationController(
      cacheService: localCacheService,
      shoppingListController: shoppingListController,
      backendGateway: backendGateway,
      authController: authController,
    );
  }

  final KeyValueStore keyValueStore;
  final LocalCacheService localCacheService;
  final HttpApiClient apiClient;
  final PricelyBackendGateway backendGateway;
  final DemoGroceryWorkflowGateway workflowGateway;

  late final AuthController authController;
  late final MarketDiscoveryController marketDiscoveryController;
  late final ShoppingListController shoppingListController;
  late final ReceiptFlowController receiptFlowController;
  late final OptimizationController optimizationController;

  factory AppServices({
    required KeyValueStore keyValueStore,
    HttpApiClient? apiClient,
    DemoGroceryWorkflowGateway? workflowGateway,
  }) {
    final resolvedApiClient = apiClient ?? HttpApiClient();
    final resolvedWorkflowGateway =
        workflowGateway ?? DemoGroceryWorkflowGateway();

    return AppServices._(
      keyValueStore: keyValueStore,
      apiClient: resolvedApiClient,
      workflowGateway: resolvedWorkflowGateway,
    );
  }

  static Future<AppServices> createDefault() async {
    final keyValueStore = await SharedPreferencesKeyValueStore.create();
    final services = AppServices(keyValueStore: keyValueStore);
    await services.initialize();
    return services;
  }

  Future<void> initialize() async {
    await authController.bootstrap();
    await marketDiscoveryController.loadInitialData();
    await shoppingListController.loadDraft();
    await optimizationController.loadCachedResult();
  }
}
