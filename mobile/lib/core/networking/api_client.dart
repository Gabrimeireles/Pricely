abstract class ApiClient {
  Future<T> get<T>(
    String path, {
    Map<String, String>? queryParameters,
    String? accessToken,
  });

  Future<T> post<T>(
    String path, {
    Object? body,
    String? accessToken,
  });
}
