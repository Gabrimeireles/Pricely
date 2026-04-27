import 'package:flutter/foundation.dart';

import '../../../core/storage/local_cache_service.dart';
import '../../shared/data/pricely_backend_gateway.dart';

class AuthController extends ChangeNotifier {
  AuthController({
    required LocalCacheService cacheService,
    required PricelyBackendGateway backendGateway,
  })  : _cacheService = cacheService,
        _backendGateway = backendGateway;

  final LocalCacheService _cacheService;
  final PricelyBackendGateway _backendGateway;

  AuthUser? _currentUser;
  String? _accessToken;
  bool _isReady = false;
  bool _isLoading = false;
  String? _errorMessage;

  AuthUser? get currentUser => _currentUser;
  String? get accessToken => _accessToken;
  bool get isReady => _isReady;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _accessToken != null && _currentUser != null;
  String? get errorMessage => _errorMessage;

  Future<void> bootstrap() async {
    _accessToken = await _cacheService.loadAuthToken();

    if (_accessToken == null || _accessToken!.isEmpty) {
      _isReady = true;
      notifyListeners();
      return;
    }

    try {
      _currentUser = await _backendGateway.fetchProfile(_accessToken!);
    } catch (_) {
      await signOut();
    } finally {
      _isReady = true;
      notifyListeners();
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await _backendGateway.signIn(
        email: email,
        password: password,
      );
      _accessToken = session.accessToken;
      _currentUser = session.user;
      await _cacheService.saveAuthToken(session.accessToken);
    } catch (error) {
      _errorMessage = 'Nao foi possivel entrar agora.';
      rethrow;
    } finally {
      _isLoading = false;
      _isReady = true;
      notifyListeners();
    }
  }

  Future<void> register({
    required String displayName,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await _backendGateway.register(
        displayName: displayName,
        email: email,
        password: password,
      );
      _accessToken = session.accessToken;
      _currentUser = session.user;
      await _cacheService.saveAuthToken(session.accessToken);
    } catch (error) {
      _errorMessage = 'Nao foi possivel criar a conta agora.';
      rethrow;
    } finally {
      _isLoading = false;
      _isReady = true;
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    if (_accessToken == null) {
      return;
    }

    _currentUser = await _backendGateway.fetchProfile(_accessToken!);
    notifyListeners();
  }

  Future<void> signOut() async {
    _accessToken = null;
    _currentUser = null;
    _errorMessage = null;
    await _cacheService.clearAuthToken();
    notifyListeners();
  }
}
