import 'package:flutter/material.dart';

import 'app_scope.dart';
import 'app_services.dart';
import 'router.dart';

class PricelyApp extends StatefulWidget {
  const PricelyApp({
    super.key,
    this.services,
  });

  final AppServices? services;

  @override
  State<PricelyApp> createState() => _PricelyAppState();
}

class _PricelyAppState extends State<PricelyApp> {
  late final Future<AppServices> _servicesFuture;

  @override
  void initState() {
    super.initState();
    _servicesFuture = widget.services != null
        ? Future.value(widget.services)
        : AppServices.createDefault();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppServices>(
      future: _servicesFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return MaterialApp(
            title: 'Pricely',
            theme: _buildTheme(),
            home: const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final services = snapshot.data!;
        final router = AppRouter(services);

        return AppScope(
          services: services,
          child: MaterialApp(
            title: 'Pricely',
            theme: _buildTheme(),
            onGenerateRoute: router.onGenerateRoute,
            initialRoute: AppRouter.homeRoute,
          ),
        );
      },
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0E7490)),
      scaffoldBackgroundColor: const Color(0xFFF4FBFD),
      useMaterial3: true,
    );
  }
}
