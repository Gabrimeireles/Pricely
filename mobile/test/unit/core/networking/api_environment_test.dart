import 'package:flutter_test/flutter_test.dart';
import 'package:pricely_mobile/core/networking/api_environment.dart';

void main() {
  test('exposes shared auth and region endpoints for local development', () {
    expect(ApiEnvironment.baseUrl, isNotEmpty);
    expect(ApiEnvironment.authBasePath, '/auth');
    expect(ApiEnvironment.regionsBasePath, '/regions');
    expect(ApiEnvironment.shoppingListsPath, '/shopping-lists');
    expect(ApiEnvironment.loginPath, '/auth/login');
    expect(ApiEnvironment.profilePath, '/auth/me');
  });
}
