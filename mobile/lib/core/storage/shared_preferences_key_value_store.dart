import 'package:shared_preferences/shared_preferences.dart';

import 'key_value_store.dart';

class SharedPreferencesKeyValueStore implements KeyValueStore {
  SharedPreferencesKeyValueStore._(this._preferences);

  final SharedPreferencesAsync _preferences;

  static Future<SharedPreferencesKeyValueStore> create() async {
    return SharedPreferencesKeyValueStore._(SharedPreferencesAsync());
  }

  @override
  Future<String?> readString(String key) => _preferences.getString(key);

  @override
  Future<void> remove(String key) => _preferences.remove(key);

  @override
  Future<void> writeString(String key, String value) =>
      _preferences.setString(key, value);
}
