import 'package:flutter/material.dart';

import '../core/widgets/app_scaffold.dart';

class AppRouter {
  static const homeRoute = '/';
  static const dashboardRoute = '/dashboard';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case dashboardRoute:
        return MaterialPageRoute<void>(
          builder: (_) => const AppScaffold(
            title: 'Dashboard',
            body: Center(
              child: Text('Admin and price dashboards will be added in later tasks.'),
            ),
          ),
        );
      case homeRoute:
      default:
        return MaterialPageRoute<void>(
          builder: (_) => const AppScaffold(
            title: 'Pricely',
            body: Center(
              child: Text('Shopping optimizer mobile foundation is ready.'),
            ),
          ),
        );
    }
  }
}
