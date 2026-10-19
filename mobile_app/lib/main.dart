import 'package:flutter/material.dart';
import 'screens/scan_screen.dart';

void main() {
  runApp(const IndoorNavApp());
}

class IndoorNavApp extends StatelessWidget {
  const IndoorNavApp({super.key});

  static const Color _yellow = Color(0xFFFFD60A);

  @override
  Widget build(BuildContext context) {
    final base = ThemeData.dark(useMaterial3: true);

    return MaterialApp(
      title: 'Indoor Nav',
      debugShowCheckedModeBanner: false,
      theme: base.copyWith(
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: _yellow,
          onPrimary: Colors.black,
          secondary: _yellow,
          onSecondary: Colors.black,
          surface: Colors.black,
          onSurface: Colors.white,
          error: Color(0xFFFF8A80),
        ),
        // Big text everywhere (explicit sizes, no scaling)
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: _yellow),
          displayMedium: TextStyle(fontSize: 42, fontWeight: FontWeight.bold, color: _yellow),
          displaySmall: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: _yellow),
          headlineLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: _yellow),
          headlineMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: _yellow),
          headlineSmall: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: _yellow),
          titleLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          titleMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
          titleSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          bodyLarge: TextStyle(fontSize: 24, color: Colors.white),
          bodyMedium: TextStyle(fontSize: 22, color: Colors.white),
          bodySmall: TextStyle(fontSize: 18, color: Colors.white),
          labelLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          foregroundColor: _yellow,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: _yellow,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        // Huge yellow buttons with black text
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: _yellow,
            foregroundColor: Colors.black,
            minimumSize: const Size(64, 80),
            textStyle: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: _yellow,
            minimumSize: const Size(64, 80),
            side: const BorderSide(color: _yellow, width: 4),
            textStyle: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
        ),
        // Destination list rows: big text, yellow outline
        listTileTheme: ListTileThemeData(
          textColor: Colors.white,
          iconColor: _yellow,
          titleTextStyle: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: _yellow, width: 2),
          ),
        ),
        cardTheme: CardThemeData(
          color: Colors.black,
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: _yellow, width: 2),
          ),
        ),
        progressIndicatorTheme: const ProgressIndicatorThemeData(color: _yellow),
      ),
      home: const ScanScreen(),
    );
  }
}