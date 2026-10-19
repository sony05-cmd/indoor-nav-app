import 'package:flutter_tts/flutter_tts.dart';

/// Wraps flutter_tts with sensible defaults for clear, unhurried
/// turn-by-turn directions — this is the core accessibility feature of
/// the whole app.
class TtsService {
  final FlutterTts _tts = FlutterTts();
  bool _initialized = false;

  Future<void> _ensureInit() async {
    if (_initialized) return;
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.45);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
    _initialized = true;
  }

  Future<void> speak(String text) async {
    await _ensureInit();
    await _tts.stop(); // cancel anything currently being read, then speak fresh
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
  }
}