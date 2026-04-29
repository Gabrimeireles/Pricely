import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'api_environment.dart';

class HttpApiClient implements ApiClient {
  HttpApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  @override
  Future<T> get<T>(
    String path, {
    Map<String, String>? queryParameters,
    String? accessToken,
  }) async {
    final uri = Uri.parse('${ApiEnvironment.baseUrl}$path').replace(
      queryParameters: queryParameters,
    );
    final response = await _client.get(uri, headers: _headers(accessToken));
    return _decodeResponse<T>(response);
  }

  @override
  Future<T> post<T>(
    String path, {
    Object? body,
    String? accessToken,
  }) async {
    final uri = Uri.parse('${ApiEnvironment.baseUrl}$path');
    final response = await _client.post(
      uri,
      headers: _headers(accessToken),
      body: body == null ? null : jsonEncode(body),
    );
    return _decodeResponse<T>(response);
  }

  Future<T> patch<T>(
    String path, {
    Object? body,
    String? accessToken,
  }) async {
    final uri = Uri.parse('${ApiEnvironment.baseUrl}$path');
    final response = await _client.patch(
      uri,
      headers: _headers(accessToken),
      body: body == null ? null : jsonEncode(body),
    );
    return _decodeResponse<T>(response);
  }

  Map<String, String> _headers(String? accessToken) {
    return <String, String>{
      'Content-Type': 'application/json',
      if (accessToken != null && accessToken.isNotEmpty)
        'Authorization': 'Bearer $accessToken',
    };
  }

  T _decodeResponse<T>(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        response.statusCode,
        response.body.isEmpty ? 'Request failed.' : response.body,
      );
    }

    if (T == String) {
      return response.body as T;
    }

    if (response.body.isEmpty) {
      return <String, dynamic>{} as T;
    }

    return jsonDecode(response.body) as T;
  }
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
