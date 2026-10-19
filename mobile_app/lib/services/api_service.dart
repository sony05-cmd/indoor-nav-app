import 'dart:convert';
import 'package:http/http.dart' as http;
import 'settings_service.dart';

/// Thin wrapper around the backend REST API — mirrors the admin web
/// tool's api.js, just in Dart instead of JavaScript.
class ApiService {
  Future<Map<String, dynamic>> lookupQr(String qrCode) async {
    final baseUrl = await SettingsService.getBaseUrl();
    final res = await http.get(Uri.parse('$baseUrl/api/nodes/lookup/$qrCode'));
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'That QR code was not recognized.'));
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Returns only nodes marked as destinations (rooms, entrances, etc.) —
  /// junctions used purely for pathfinding are excluded from the picker.
  Future<List<Map<String, dynamic>>> getDestinationsForFloor(String floorId) async {
    final baseUrl = await SettingsService.getBaseUrl();
    final res = await http.get(Uri.parse('$baseUrl/api/nodes/floor/$floorId'));
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Could not load destinations.'));
    }
    final List<dynamic> nodes = jsonDecode(res.body);
    return nodes
        .cast<Map<String, dynamic>>()
        .where((n) => n['isDestination'] == true)
        .toList();
  }
    /// Destinations from EVERY floor of the building, each tagged with its
  /// floor name/level so the UI can group them.
  Future<List<Map<String, dynamic>>> getDestinationsForBuilding(String buildingId) async {
    final baseUrl = await SettingsService.getBaseUrl();
    final res = await http.get(Uri.parse('$baseUrl/api/buildings/$buildingId'));
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Could not load destinations.'));
    }
    final building = jsonDecode(res.body) as Map<String, dynamic>;
    final floors = ((building['floors'] as List<dynamic>?) ?? []).cast<Map<String, dynamic>>();

    final result = <Map<String, dynamic>>[];
    for (final f in floors) {
      final nodes = ((f['nodes'] as List<dynamic>?) ?? []).cast<Map<String, dynamic>>();
      for (final n in nodes) {
        if (n['isDestination'] == true) {
          result.add({
            ...n,
            'floorId': f['id'],
            'floorName': f['name'],
            'floorLevel': f['level'],
          });
        }
      }
    }
    return result;
  }

  Future<Map<String, dynamic>> navigate({
    required String buildingId,
    required String startNodeId,
    required String endNodeId,
  }) async {
    final baseUrl = await SettingsService.getBaseUrl();
    final uri = Uri.parse(
      '$baseUrl/api/navigate?buildingId=$buildingId&startNodeId=$startNodeId&endNodeId=$endNodeId',
    );
    final res = await http.get(uri);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Could not find a path to that destination.'));
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  String _errorMessage(http.Response res, String fallback) {
    try {
      final body = jsonDecode(res.body);
      return body['error'] ?? fallback;
    } catch (_) {
      return fallback;
    }
  }
}