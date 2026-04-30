import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/features/discovery/application/market_discovery_controller.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

void main() {
  test('loads public regions and updates offers when the region changes', () async {
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path == '/regions') {
            return http.Response(
              jsonEncode(<dynamic>[
                <String, dynamic>{
                  'id': 'region-1',
                  'slug': 'campinas-sp',
                  'name': 'Campinas',
                  'stateCode': 'SP',
                  'implantationStatus': 'activating',
                  'activeEstablishmentCount': 0,
                  'offerCoverageStatus': 'collecting_data',
                },
                <String, dynamic>{
                  'id': 'region-2',
                  'slug': 'sao-paulo-sp',
                  'name': 'Sao Paulo',
                  'stateCode': 'SP',
                  'implantationStatus': 'active',
                  'activeEstablishmentCount': 2,
                  'offerCoverageStatus': 'live',
                },
              ]),
              200,
            );
          }

          if (request.url.path == '/regions/campinas-sp/offers') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'offers': <dynamic>[],
              }),
              200,
            );
          }

          if (request.url.path == '/regions/sao-paulo-sp/offers') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'offers': <dynamic>[
                  <String, dynamic>{
                    'id': 'offer-1',
                    'productId': 'product-1',
                    'productName': 'Cafe torrado',
                    'displayName': 'Cafe torrado 500g',
                    'packageLabel': '500 g',
                    'priceAmount': 15.9,
                    'observedAt': '2026-04-27T10:00:00.000Z',
                    'sourceLabel': 'Painel admin',
                    'storeName': 'Mercado Centro',
                    'neighborhood': 'Centro',
                    'confidenceLevel': 'high',
                  },
                ],
              }),
              200,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );

    final controller = MarketDiscoveryController(backendGateway);

    await controller.loadInitialData();

    expect(controller.regions, hasLength(2));
    expect(controller.selectedRegion, isNull);
    expect(controller.offers, isEmpty);

    await controller.selectRegion('campinas-sp');

    expect(controller.selectedRegion?.slug, 'campinas-sp');
    expect(controller.offers, isEmpty);

    await controller.selectRegion('sao-paulo-sp');

    expect(controller.selectedRegion?.slug, 'sao-paulo-sp');
    expect(controller.offers, hasLength(1));
    expect(controller.offers.single.productName, 'Cafe torrado');
  });
}
