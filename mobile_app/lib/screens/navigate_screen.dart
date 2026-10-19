import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/tts_service.dart';

class NavigateScreen extends StatefulWidget {
  final String buildingId;
  final Map<String, dynamic> startNode;
  final Map<String, dynamic> endNode;
  const NavigateScreen({
    super.key,
    required this.buildingId,
    required this.startNode,
    required this.endNode,
  });

  @override
  State<NavigateScreen> createState() => _NavigateScreenState();
}

class _NavigateScreenState extends State<NavigateScreen> {
  static const Color _yellow = Color(0xFFFFD60A);

  final ApiService _api = ApiService();
  final TtsService _tts = TtsService();
  bool _loading = true;
  String? _error;
  List<dynamic> _steps = [];
  int _currentStep = 0;
  double? _totalDistance;
  String? _destinationName;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  Future<void> _loadRoute() async {
    try {
      final result = await _api.navigate(
        buildingId: widget.buildingId,
        startNodeId: widget.startNode['id'],
        endNodeId: widget.endNode['id'],
      );
      setState(() {
        _steps = result['steps'] ?? [];
        _totalDistance = (result['totalDistanceMeters'] as num?)?.toDouble();
        _destinationName = result['destinationName'];
        _loading = false;
      });
      _speakIntroThenFirstStep();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
      _tts.speak(_error!);
    }
  }

  Future<void> _speakIntroThenFirstStep() async {
    final dest = _destinationName ?? 'your destination';
    final dist = _totalDistance != null ? '${_totalDistance!.round()} meters' : '';
    await _tts.speak(
        'Heading to $dest. Total distance about $dist. Tap anywhere on the screen for the next step. Press and hold to repeat.');
    await Future.delayed(const Duration(milliseconds: 300));
    _speakCurrentStep();
  }

  void _speakCurrentStep() {
    if (_currentStep >= _steps.length) {
      _tts.speak('You have arrived at $_destinationName.');
      return;
    }
    _tts.speak(_steps[_currentStep]['text'] as String? ?? 'Continue.');
  }

  void _nextStep() {
    if (_currentStep < _steps.length) {
      HapticFeedback.mediumImpact();
      setState(() => _currentStep++);
      _speakCurrentStep();
    }
  }

  void _repeatStep() {
    HapticFeedback.lightImpact();
    _speakCurrentStep();
  }

  void _finish() {
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Navigating')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildError()
                : _buildNavigation(),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.error_outline, size: 72, color: _yellow),
          const SizedBox(height: 20),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, color: Colors.white),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Go back'),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigation() {
    final arrived = _currentStep >= _steps.length;
    final stepText = arrived
        ? 'You have arrived at $_destinationName'
        : (_steps[_currentStep]['text'] as String? ?? 'Continue');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        Container(
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: _yellow, width: 3),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'To: ${_destinationName ?? ''}',
                style: const TextStyle(
                    fontSize: 28, fontWeight: FontWeight.bold, color: _yellow),
              ),
              const SizedBox(height: 4),
              Text(
                _totalDistance != null
                    ? 'About ${_totalDistance!.round()} meters'
                    : '',
                style: const TextStyle(fontSize: 22, color: Colors.white),
              ),
            ],
          ),
        ),

        // Giant tap area = current step
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: arrived ? _finish : _nextStep,
            onLongPress: _repeatStep,
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Semantics(
                  liveRegion: true,
                  hint: 'Tap anywhere for the next step. Press and hold to repeat.',
                  child: Text(
                    stepText,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.25,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),

        // Caption
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            arrived
                ? 'Tap anywhere to finish'
                : 'Step ${_currentStep + 1} of ${_steps.length}  •  Tap anywhere for next',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, color: _yellow),
          ),
        ),
        const SizedBox(height: 12),

        // Buttons: equal width, side by side
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _repeatStep,
                  child: const Text('Repeat'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: arrived ? _finish : _nextStep,
                  child: Text(arrived ? 'Done' : 'Next'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}