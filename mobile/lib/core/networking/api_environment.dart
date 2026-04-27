class ApiEnvironment {
  const ApiEnvironment._();

  static const String baseUrl = String.fromEnvironment(
    'PRICELY_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const String authBasePath = '/auth';
  static const String regionsBasePath = '/regions';
  static const String shoppingListsPath = '/shopping-lists';

  static const String loginPath = '$authBasePath/login';
  static const String registerPath = '$authBasePath/register';
  static const String profilePath = '$authBasePath/me';
}
