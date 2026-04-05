import 'package:flutter/material.dart';

import '../features/optimization/presentation/multi_market_result_screen.dart';
import '../features/receipts/presentation/receipt_submission_screen.dart';
import '../features/shopping_lists/presentation/shopping_list_screen.dart';
import '../core/widgets/app_scaffold.dart';
import 'app_services.dart';

class AppRouter {
  AppRouter(this.services);

  static const homeRoute = '/';
  static const receiptsRoute = '/receipts';
  static const optimizationRoute = '/optimization';
  static const dashboardRoute = '/dashboard';

  final AppServices services;

  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case receiptsRoute:
        return MaterialPageRoute<void>(
          builder: (_) => ReceiptSubmissionScreen(
            controller: services.receiptFlowController,
          ),
        );
      case optimizationRoute:
        return MaterialPageRoute<void>(
          builder: (_) => MultiMarketResultScreen(
            controller: services.optimizationController,
          ),
        );
      case dashboardRoute:
        return MaterialPageRoute<void>(
          builder: (_) => const AppScaffold(
            title: 'Dashboard',
            body: Center(
              child: Text(
                  'Admin and price dashboards will be added in later tasks.'),
            ),
          ),
        );
      case homeRoute:
      default:
        return MaterialPageRoute<void>(
          builder: (_) => ShoppingListScreen(
            controller: services.shoppingListController,
            optimizationController: services.optimizationController,
          ),
        );
    }
  }
}
