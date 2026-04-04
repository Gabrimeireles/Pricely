import 'package:flutter/material.dart';

void main() {
  runApp(const PricelyApp());
}

class PricelyApp extends StatelessWidget {
  const PricelyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pricely',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0E7490)),
        useMaterial3: true,
      ),
      home: const _BootstrapScreen(),
    );
  }
}

class _BootstrapScreen extends StatelessWidget {
  const _BootstrapScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Pricely mobile workspace initialized'),
      ),
    );
  }
}
