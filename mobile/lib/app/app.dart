import 'package:flutter/material.dart';

import 'router.dart';

class PricelyApp extends StatelessWidget {
  const PricelyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pricely',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0E7490)),
        scaffoldBackgroundColor: const Color(0xFFF4FBFD),
        useMaterial3: true,
      ),
      onGenerateRoute: AppRouter.onGenerateRoute,
      initialRoute: AppRouter.homeRoute,
    );
  }
}
