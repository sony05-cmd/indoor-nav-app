import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'navigate_screen.dart';

/// Shown right after a successful QR scan. Lists destinations from the
/// whole building: the current floor first, then the other floors.
class DestinationScreen extends StatefulWidget {
  final Map<String, dynamic> currentNode;

  const DestinationScreen({super.key, required this.currentNode});

  @override
  State<DestinationScreen> createState() => _DestinationScreenState();
}

class _DestinationScreenState extends State<DestinationScreen> {
  static const Color _yellow = Color(0xFFFFD60A);

  final ApiService _api = ApiService();
  // Each row is either a String (floor heading) or a Map (a destination).
  List<Object> _rows = [];
  bool _loading = true;
  String? _error;

  String? get _buildingId =>
      widget.currentNode['floor']?['building']?['id'] as String?;

  @override
  void initState() {
    super.initState();
    _loadDestinations();
  }

  Future<void> _loadDestinations() async {
    final buildingId = _buildingId;
    if (buildingId == null) {
      setState(() {
        _error = 'This location has no building information.';
        _loading = false;
      });
      return;
    }

    try {
      final all = await _api.getDestinationsForBuilding(buildingId);
      all.removeWhere((d) => d['id'] == widget.currentNode['id']);

      // Group by floor
      final Map<String, List<Map<String, dynamic>>> byFloor = {};
      final Map<String, num> levelOf = {};
      for (final d in all) {
        final name = (d['floorName'] ?? 'Floor').toString();
        byFloor.putIfAbsent(name, () => []).add(d);
        levelOf[name] = (d['floorLevel'] as num?) ?? 0;
      }

      // Current floor first, then the others by level
      final currentFloorId = widget.currentNode['floorId'];
      final names = byFloor.keys.toList();
      String? currentName;
      for (final d in all) {
        if (d['floorId'] == currentFloorId) {
          currentName = (d['floorName'] ?? 'Floor').toString();
          break;
        }
      }
      names.sort((a, b) {
        if (a == currentName) return -1;
        if (b == currentName) return 1;
        return levelOf[a]!.compareTo(levelOf[b]!);
      });

      final rows = <Object>[];
      for (final name in names) {
        final isHere = name == currentName;
        rows.add(isHere ? '$name (you are here)' : name);
        rows.addAll(byFloor[name]!);
      }

      setState(() {
        _rows = rows;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Could not load destinations. Check your connection and try again.';
        _loading = false;
      });
    }
  }

  void _selectDestination(Map<String, dynamic> destination) {
    final buildingId = _buildingId;
    if (buildingId == null) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NavigateScreen(
          buildingId: buildingId,
          startNode: widget.currentNode,
          endNode: destination,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentName = widget.currentNode['name'] ?? 'Unknown location';

    return Scaffold(
      appBar: AppBar(title: const Text('Choose destination')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: _yellow, width: 3),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'You are at: $currentName',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: _yellow,
              ),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 24, color: Colors.white),
          ),
        ),
      );
    }
    if (_rows.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'No destinations found in this building yet.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 24, color: Colors.white),
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      itemCount: _rows.length,
      itemBuilder: (context, index) {
        final row = _rows[index];

        if (row is String) {
          return Semantics(
            header: true,
            child: Padding(
              padding: const EdgeInsets.only(top: 16, bottom: 8),
              child: Text(
                row,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: _yellow,
                ),
              ),
            ),
          );
        }

        final d = row as Map<String, dynamic>;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(d['name'] ?? 'Unnamed'),
            subtitle: Text(
              (d['type'] ?? '').toString().toUpperCase(),
              style: const TextStyle(fontSize: 18, color: _yellow),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 28),
            onTap: () => _selectDestination(d),
          ),
        );
      },
    );
  }
}