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
            theme: _buildTheme(Brightness.light),
            darkTheme: _buildTheme(Brightness.dark),
            themeMode: ThemeMode.system,
            home: const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final services = snapshot.data!;
        final router = AppRouter(services);

        return AnimatedBuilder(
          animation: services.themeController,
          builder: (context, _) => AppScope(
            services: services,
            child: MaterialApp(
              title: 'Pricely',
              theme: _buildTheme(Brightness.light),
              darkTheme: _buildTheme(Brightness.dark),
              themeMode: services.themeController.themeMode,
              onGenerateRoute: router.onGenerateRoute,
              initialRoute: AppRouter.homeRoute,
            ),
          ),
        );
      },
    );
  }

  ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0F766E),
      brightness: brightness,
      surface: isDark ? const Color(0xFF101915) : const Color(0xFFF1FCF7),
    ).copyWith(
      primary: isDark ? const Color(0xFF80D5CB) : const Color(0xFF005C55),
      onPrimary: isDark ? const Color(0xFF003733) : Colors.white,
      primaryContainer:
          isDark ? const Color(0xFF004F49) : const Color(0xFF0F766E),
      onPrimaryContainer: const Color(0xFFA3FAEF),
      secondary: isDark ? const Color(0xFFB4C5FF) : const Color(0xFF0051D5),
      onSecondary: isDark ? const Color(0xFF002B74) : Colors.white,
      secondaryContainer:
          isDark ? const Color(0xFF173F8C) : const Color(0xFFDBE1FF),
      onSecondaryContainer:
          isDark ? const Color(0xFFDCE2FF) : const Color(0xFF00174B),
      tertiary: isDark ? const Color(0xFFB5E879) : const Color(0xFF375B00),
      onTertiary: isDark ? const Color(0xFF1C3700) : Colors.white,
      tertiaryContainer:
          isDark ? const Color(0xFF2E5200) : const Color(0xFF487500),
      onTertiaryContainer: const Color(0xFFB5FF56),
      error: const Color(0xFFBA1A1A),
      onError: Colors.white,
      errorContainer:
          isDark ? const Color(0xFF93000A) : const Color(0xFFFFDAD6),
      onErrorContainer:
          isDark ? const Color(0xFFFFDAD6) : const Color(0xFF93000A),
      surface: isDark ? const Color(0xFF101915) : const Color(0xFFF1FCF7),
      onSurface: isDark ? const Color(0xFFDDE6E1) : const Color(0xFF141E1B),
      onSurfaceVariant:
          isDark ? const Color(0xFFBEC9C5) : const Color(0xFF3E4947),
      outline: isDark ? const Color(0xFF89938F) : const Color(0xFF6E7977),
      outlineVariant:
          isDark ? const Color(0xFF3F4946) : const Color(0xFFBDC9C6),
      inverseSurface: const Color(0xFF28332F),
      onInverseSurface: const Color(0xFFE8F3EE),
      inversePrimary: const Color(0xFF80D5CB),
      shadow: const Color(0x0F141E1B),
      scrim: Colors.black54,
    );

    return ThemeData(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.surface,
      useMaterial3: true,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor:
            isDark ? const Color(0xFF17211D) : Colors.white,
        indicatorColor:
            isDark ? const Color(0xFF004F49) : const Color(0xFFE0F3EF),
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
        fillColor: isDark ? const Color(0xFF17211D) : Colors.white,
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
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.primary,
          minimumSize: const Size(0, 52),
          side: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.4)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }
}
