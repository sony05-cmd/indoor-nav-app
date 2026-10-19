import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/api_service.dart';
import 'destination_screen.dart';

/// Home screen: scan a QR code to establish "where am I right now".
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  static const Color _yellow = Color(0xFFFFD60A);

  final ApiService _api = ApiService();
  bool _processing = false;
  String? _error;

  Future<void> _handleDetection(BarcodeCapture capture) async {
    if (_processing) return; // ignore extra detections while handling one
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    // Lock immediately (before any await) so a 2nd detection can't sneak in.
    _processing = true;
    setState(() => _error = null);

    try {
      final node = await _api.lookupQr(code);
      if (!mounted) return;
      // AWAIT the push: stay locked until the user comes back to this screen.
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DestinationScreen(currentNode: node),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      _processing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan your location')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 3,
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              decoration: BoxDecoration(
                border: Border.all(color: _yellow, width: 4),
                borderRadius: BorderRadius.circular(20),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: MobileScanner(onDetect: _handleDetection),
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Center(
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    _error ??
                        'Point your camera at a QR sticker to find out where you are.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _error != null
                          ? const Color(0xFFFF8A80)
                          : Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}