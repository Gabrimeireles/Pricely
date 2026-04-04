abstract class ApiClient {
  Future<T> get<T>(String path, {Map<String, String>? queryParameters});

  Future<T> post<T>(String path, {Object? body});
}
