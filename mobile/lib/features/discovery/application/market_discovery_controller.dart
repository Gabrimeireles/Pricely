import 'package:flutter/foundation.dart';

import '../../shared/data/pricely_backend_gateway.dart';

class MarketDiscoveryController extends ChangeNotifier {
  MarketDiscoveryController(this._backendGateway);

  final PricelyBackendGateway _backendGateway;

  List<PublicRegionSummary> _regions = <PublicRegionSummary>[];
  List<PublicOfferSummary> _offers = <PublicOfferSummary>[];
  String? _selectedRegionSlug;
  bool _isLoading = false;
  String? _errorMessage;

  List<PublicRegionSummary> get regions => _regions;
  List<PublicOfferSummary> get offers => _offers;
  String? get selectedRegionSlug => _selectedRegionSlug;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  PublicRegionSummary? get selectedRegion {
    if (_selectedRegionSlug == null) {
      return null;
    }

    for (final region in _regions) {
      if (region.slug == _selectedRegionSlug) {
        return region;
      }
    }

    return null;
  }

  Future<void> loadInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _regions = await _backendGateway.fetchPublicRegions();
      if (_regions.isNotEmpty) {
        _selectedRegionSlug ??= _regions.first.slug;
      }

      await _loadOffersForSelectedRegion();
    } catch (_) {
      _errorMessage = 'Nao foi possivel carregar regioes e ofertas agora.';
      _offers = <PublicOfferSummary>[];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> selectRegion(String? regionSlug) async {
    if (regionSlug == null || regionSlug == _selectedRegionSlug) {
      return;
    }

    _selectedRegionSlug = regionSlug;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _loadOffersForSelectedRegion();
    } catch (_) {
      _errorMessage = 'Nao foi possivel atualizar as ofertas desta regiao.';
      _offers = <PublicOfferSummary>[];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await loadInitialData();
  }

  Future<void> _loadOffersForSelectedRegion() async {
    final regionSlug = _selectedRegionSlug;
    if (regionSlug == null) {
      _offers = <PublicOfferSummary>[];
      return;
    }

    _offers = await _backendGateway.fetchRegionOffers(regionSlug);
  }
}
