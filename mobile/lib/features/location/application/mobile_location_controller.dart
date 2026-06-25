import 'package:flutter/foundation.dart';

import '../../auth/application/auth_controller.dart';
import '../../discovery/application/market_discovery_controller.dart';
import '../../shared/data/pricely_backend_gateway.dart';

enum MobileLocationStatus {
  manual,
  requesting,
  allowed,
  denied,
  restricted,
  unavailable,
  serviceDisabled,
  error,
}

class MobileLocationReading {
  const MobileLocationReading({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
  });

  final double latitude;
  final double longitude;
  final double? accuracyMeters;
}

class MobileLocationCaptureResult {
  const MobileLocationCaptureResult({
    required this.status,
    this.reading,
  });

  final MobileLocationStatus status;
  final MobileLocationReading? reading;
}

abstract class MobileLocationService {
  Future<MobileLocationCaptureResult> captureCurrentLocation();
}

class MobileLocationController extends ChangeNotifier {
  MobileLocationController({
    required AuthController authController,
    required MarketDiscoveryController discoveryController,
    required PricelyBackendGateway backendGateway,
    required MobileLocationService locationService,
  })  : _authController = authController,
        _discoveryController = discoveryController,
        _backendGateway = backendGateway,
        _locationService = locationService;

  final AuthController _authController;
  final MarketDiscoveryController _discoveryController;
  final PricelyBackendGateway _backendGateway;
  final MobileLocationService _locationService;

  MobileLocationStatus _status = MobileLocationStatus.manual;
  UserLocationPreferenceSummary? _activePreference;
  LocationCoveragePreviewSummary? _coveragePreview;
  String? _message;

  MobileLocationStatus get status => _status;
  UserLocationPreferenceSummary? get activePreference => _activePreference;
  LocationCoveragePreviewSummary? get coveragePreview => _coveragePreview;
  String? get message => _message;

  bool get isRequesting => _status == MobileLocationStatus.requesting;

  String? preferenceIdForRegionSlug(String? regionSlug) {
    final preference = _activePreference;
    if (preference == null || regionSlug == null) {
      return null;
    }
    return preference.regionSlug == regionSlug ? preference.id : null;
  }

  Future<void> captureAndSave({double coverageRadiusKm = 5}) async {
    final accessToken = _authController.accessToken;
    if (accessToken == null) {
      _status = MobileLocationStatus.error;
      _message = 'Entre na conta para salvar a localizacao local.';
      notifyListeners();
      return;
    }

    final region = _discoveryController.selectedRegion;
    if (region == null) {
      _status = MobileLocationStatus.error;
      _message = 'Escolha uma cidade antes de salvar a localizacao.';
      notifyListeners();
      return;
    }

    _status = MobileLocationStatus.requesting;
    _message = 'Solicitando permissao de localizacao.';
    notifyListeners();

    final capture = await _locationService.captureCurrentLocation();
    if (capture.reading == null || capture.status != MobileLocationStatus.allowed) {
      _activePreference = null;
      _coveragePreview = null;
      _status = capture.status;
      _message = _messageForStatus(capture.status);
      notifyListeners();
      return;
    }

    try {
      final reading = capture.reading!;
      _coveragePreview = await _backendGateway.previewLocationCoverage(
        accessToken: accessToken,
        regionId: region.id,
        latitude: reading.latitude,
        longitude: reading.longitude,
        coverageRadiusKm: coverageRadiusKm,
      );
      final saved = await _backendGateway.upsertLocationPreference(
        accessToken: accessToken,
        regionId: region.id,
        label: 'Local atual',
        latitude: reading.latitude,
        longitude: reading.longitude,
        coverageRadiusKm: coverageRadiusKm,
        isDefault: true,
        locationSource: 'browser_geolocation',
      );
      _activePreference = saved;
      _status = MobileLocationStatus.allowed;
      _message =
          'Preview local: ${_coveragePreview!.activeEstablishmentCount} lojas dentro de ${_coveragePreview!.coverageRadiusKm.toStringAsFixed(0)} km. Localizacao salva.';
    } catch (_) {
      _status = MobileLocationStatus.error;
      _message = 'Nao foi possivel salvar a localizacao agora.';
    } finally {
      notifyListeners();
    }
  }

  Future<void> saveManualPostalCode({
    required String postalCode,
    double coverageRadiusKm = 5,
  }) async {
    final accessToken = _authController.accessToken;
    final region = _discoveryController.selectedRegion;
    final normalizedPostalCode = postalCode.replaceAll(RegExp(r'\D'), '');
    if (accessToken == null || region == null) {
      _status = MobileLocationStatus.error;
      _message = 'Entre na conta e escolha uma cidade antes de salvar o CEP.';
      notifyListeners();
      return;
    }
    if (normalizedPostalCode.length != 8) {
      _status = MobileLocationStatus.error;
      _message = 'Informe um CEP com 8 digitos.';
      notifyListeners();
      return;
    }

    _status = MobileLocationStatus.requesting;
    _message = 'Calculando cobertura aproximada pelo CEP.';
    notifyListeners();
    try {
      _coveragePreview = await _backendGateway.previewLocationCoverage(
        accessToken: accessToken,
        regionId: region.id,
        postalCode: normalizedPostalCode,
        coverageRadiusKm: coverageRadiusKm,
      );
      _activePreference = await _backendGateway.upsertLocationPreference(
        accessToken: accessToken,
        regionId: region.id,
        label: 'CEP $normalizedPostalCode',
        postalCode: normalizedPostalCode,
        coverageRadiusKm: coverageRadiusKm,
        isDefault: true,
        locationSource: 'postal_code_fallback',
      );
      _status = MobileLocationStatus.manual;
      _message =
          'CEP salvo. A cobertura e aproximada e nao representa distancia real ate as lojas.';
    } catch (_) {
      _status = MobileLocationStatus.error;
      _message = 'Nao foi possivel salvar o CEP agora.';
    } finally {
      notifyListeners();
    }
  }

  String _messageForStatus(MobileLocationStatus status) {
    switch (status) {
      case MobileLocationStatus.denied:
        return 'Permissao negada. Use a cidade selecionada ou permita localizacao no sistema.';
      case MobileLocationStatus.restricted:
        return 'Permissao restrita pelo sistema. A otimizacao local fica indisponivel.';
      case MobileLocationStatus.serviceDisabled:
        return 'Servico de localizacao desligado. Ative o GPS para usar modos locais.';
      case MobileLocationStatus.unavailable:
        return 'Localizacao indisponivel neste dispositivo.';
      case MobileLocationStatus.error:
        return 'Nao foi possivel capturar a localizacao.';
      case MobileLocationStatus.manual:
        return 'Modo manual: escolha a cidade e salve a localizacao quando quiser usar modos locais.';
      case MobileLocationStatus.requesting:
        return 'Solicitando permissao de localizacao.';
      case MobileLocationStatus.allowed:
        return 'Localizacao salva para otimizacao local.';
    }
  }
}
