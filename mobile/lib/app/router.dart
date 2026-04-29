import 'package:flutter/material.dart';

import '../features/auth/presentation/auth_screen.dart';
import '../features/home/presentation/mobile_home_screen.dart';
import '../features/optimization/presentation/multi_market_result_screen.dart';
import '../features/receipts/presentation/receipt_submission_screen.dart';
import 'app_services.dart';

class AppRouter {
  AppRouter(this.services);

  static const homeRoute = '/';
  static const authRoute = '/auth';
  static const receiptsRoute = '/receipts';
  static const optimizationRoute = '/optimization';
  static const dashboardRoute = '/dashboard';

  final AppServices services;

  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case authRoute:
        return MaterialPageRoute<void>(
          builder: (_) => AuthScreen(
            controller: services.authController,
          ),
        );
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
            shoppingListController: services.shoppingListController,
          ),
        );
      case dashboardRoute:
        return MaterialPageRoute<void>(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Dashboard')),
            body: const Center(
              child: Text('Metricas administrativas continuam restritas ao web.'),
            ),
          ),
        );
      case homeRoute:
      default:
        return MaterialPageRoute<void>(
          builder: (_) => MobileHomeScreen(
            authController: services.authController,
            discoveryController: services.marketDiscoveryController,
            shoppingListController: services.shoppingListController,
            optimizationController: services.optimizationController,
            receiptFlowController: services.receiptFlowController,
          ),
        );
    }
  }
}
