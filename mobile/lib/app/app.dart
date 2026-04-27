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
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0F766E),
      brightness: Brightness.light,
      surface: const Color(0xFFF1FCF7),
    ).copyWith(
      primary: const Color(0xFF005C55),
      onPrimary: Colors.white,
      primaryContainer: const Color(0xFF0F766E),
      onPrimaryContainer: const Color(0xFFA3FAEF),
      secondary: const Color(0xFF0051D5),
      onSecondary: Colors.white,
      secondaryContainer: const Color(0xFFDBE1FF),
      onSecondaryContainer: const Color(0xFF00174B),
      tertiary: const Color(0xFF375B00),
      onTertiary: Colors.white,
      tertiaryContainer: const Color(0xFF487500),
      onTertiaryContainer: const Color(0xFFB5FF56),
      error: const Color(0xFFBA1A1A),
      onError: Colors.white,
      errorContainer: const Color(0xFFFFDAD6),
      onErrorContainer: const Color(0xFF93000A),
      surface: const Color(0xFFF1FCF7),
      onSurface: const Color(0xFF141E1B),
      onSurfaceVariant: const Color(0xFF3E4947),
      outline: const Color(0xFF6E7977),
      outlineVariant: const Color(0xFFBDC9C6),
      inverseSurface: const Color(0xFF28332F),
      onInverseSurface: const Color(0xFFE8F3EE),
      inversePrimary: const Color(0xFF80D5CB),
      shadow: const Color(0x0F141E1B),
      scrim: Colors.black54,
    );

    return ThemeData(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFFF1FCF7),
      useMaterial3: true,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: Color(0xFF141E1B),
        elevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE0F3EF),
        labelTextStyle: WidgetStateProperty.resolveWith<TextStyle?>(
          (states) => TextStyle(
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF005C55), width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFF005C55),
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF005C55),
          minimumSize: const Size(0, 52),
          side: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.4)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }
}
