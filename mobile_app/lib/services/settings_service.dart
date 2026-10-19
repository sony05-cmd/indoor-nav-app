import 'package:shared_preferences/shared_preferences.dart';

/// Stores the backend base URL persistently on the device, mirroring how
/// the admin web tool saves it in localStorage. Defaults to the deployed
/// Render backend so the app works out of the box without configuration.
class SettingsService {
  static const _key = 'backend_url';
  static const defaultBaseUrl = 'https://indoor-nav-backend-tm6t.onrender.com';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key) ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    // Strip a trailing slash so we don't end up with "//api/..." in requests.
    final cleaned = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    await prefs.setString(_key, cleaned);
  }
}