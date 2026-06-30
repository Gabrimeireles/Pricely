import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pricely_mobile/core/networking/http_api_client.dart';
import 'package:pricely_mobile/core/storage/local_cache_service.dart';
import 'package:pricely_mobile/features/auth/application/auth_controller.dart';
import 'package:pricely_mobile/features/optimization/data/demo_grocery_workflow_gateway.dart';
import 'package:pricely_mobile/features/receipts/application/receipt_flow_controller.dart';
import 'package:pricely_mobile/features/receipts/presentation/receipt_submission_screen.dart';
import 'package:pricely_mobile/features/shared/data/pricely_backend_gateway.dart';

import '../../../support/in_memory_key_value_store.dart';

Map<String, dynamic> _receiptPayload(String processingStatus) => <String, dynamic>{
      'id': 'receipt-1',
      'storeName': 'Mercado Centro',
      'storeCnpj': '00.000.000/0001-00',
      'parseStatus': 'partial',
      'ingestedItems': 3,
      'lowConfidenceItems': <dynamic>['Leite'],
      'moderationStatus': 'pending',
      'processingStatus': processingStatus,
      'reviewReason': 'receipt_reward_ready',
      'rewardEligibilityStatus': 'eligible_pending',
      'rewardPoints': 100,
      'rewardOptimizationTokens': 1,
      'rewardMessage': 'Reward em processamento.',
      'trustLevel': 'medium',
    };

void main() {
  testWidgets('renders idle form and shows submission instructions', (tester) async {
    final controller = ReceiptFlowController(DemoGroceryWorkflowGateway());

    await tester.pumpWidget(
      MaterialApp(
        home: ReceiptSubmissionScreen(controller: controller),
      ),
    );

    expect(find.text('Enviar nota fiscal'), findsOneWidget);
    expect(
      find.textContaining('aguarda liberacao administrativa'),
      findsOneWidget,
    );
    expect(find.text('Enviar nota para fila'), findsOneWidget);
    expect(find.text('Nome da loja (opcional)'), findsOneWidget);
  });

  testWidgets('submits receipt and shows waiting_manual_release summary card', (tester) async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-xyz');

    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path == '/auth/me') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'user-1',
                'email': 'c@pricely.app',
                'displayName': 'C Pricely',
                'role': 'customer',
                'profileStats': <String, dynamic>{
                  'shoppingListsCount': 0,
                  'totalEstimatedSavings': 0,
                  'completedOptimizationRuns': 0,
                  'contributionsCount': 0,
                  'receiptSubmissionsCount': 0,
                  'offerReportsCount': 0,
                },
              }),
              200,
            );
          }

          if (request.url.path == '/receipts' && request.method == 'POST') {
            return http.Response(
              jsonEncode(_receiptPayload('waiting_manual_release')),
              201,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );

    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();

    final controller = ReceiptFlowController(
      DemoGroceryWorkflowGateway(),
      authController: authController,
      backendGateway: backendGateway,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ReceiptSubmissionScreen(controller: controller),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextField, 'Nome da loja (opcional)'),
      'Mercado Centro',
    );
    await tester.tap(find.text('Enviar nota para fila'));
    await tester.pump();

    expect(find.text('Enviando...'), findsOneWidget);
    await tester.pumpAndSettle();

    expect(find.text('Mercado Centro'), findsOneWidget);
    expect(find.text('3 itens recebidos'), findsOneWidget);
    expect(find.textContaining('aguardando liberacao manual'), findsOneWidget);
    expect(find.textContaining('em validacao'), findsOneWidget);
    expect(find.textContaining('Baixa confianca: Leite'), findsOneWidget);
    expect(find.text('Atualizar andamento'), findsOneWidget);
  });

  testWidgets('refresh updates submission from waiting_manual_release to queued', (tester) async {
    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-xyz');

    var refreshCalled = false;
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient((request) async {
          if (request.url.path == '/auth/me') {
            return http.Response(
              jsonEncode(<String, dynamic>{
                'id': 'user-1',
                'email': 'c@pricely.app',
                'displayName': 'C Pricely',
                'role': 'customer',
                'profileStats': <String, dynamic>{
                  'shoppingListsCount': 0,
                  'totalEstimatedSavings': 0,
                  'completedOptimizationRuns': 0,
                  'contributionsCount': 0,
                  'receiptSubmissionsCount': 0,
                  'offerReportsCount': 0,
                },
              }),
              200,
            );
          }

          if (request.url.path == '/receipts' && request.method == 'POST') {
            return http.Response(
              jsonEncode(_receiptPayload('waiting_manual_release')),
              201,
            );
          }

          if (request.url.path == '/receipts/receipt-1' &&
              request.method == 'GET') {
            refreshCalled = true;
            return http.Response(
              jsonEncode(_receiptPayload('queued')),
              200,
            );
          }

          return http.Response('{}', 404);
        }),
      ),
    );

    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap();

    final controller = ReceiptFlowController(
      DemoGroceryWorkflowGateway(),
      authController: authController,
      backendGateway: backendGateway,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ReceiptSubmissionScreen(controller: controller),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextField, 'Nome da loja (opcional)'),
      'Mercado Centro',
    );
    await tester.tap(find.text('Enviar nota para fila'));
    await tester.pumpAndSettle();

    expect(find.textContaining('aguardando liberacao manual'), findsOneWidget);

    await tester.tap(find.text('Atualizar andamento'));
    await tester.pumpAndSettle();

    expect(refreshCalled, isTrue);
    expect(find.textContaining('liberada para processamento'), findsOneWidget);
  });

  testWidgets('shows error message when submission fails', (tester) async {
    final backendGateway = PricelyBackendGateway(
      HttpApiClient(
        client: MockClient(
          (request) async => http.Response('{"error":"server error"}', 500),
        ),
      ),
    );

    final cacheService = LocalCacheService(InMemoryKeyValueStore());
    await cacheService.saveAuthToken('token-xyz');
    final authController = AuthController(
      cacheService: cacheService,
      backendGateway: backendGateway,
    );
    await authController.bootstrap().catchError((_) {});

    final controller = ReceiptFlowController(
      DemoGroceryWorkflowGateway(),
      authController: authController,
      backendGateway: backendGateway,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: ReceiptSubmissionScreen(controller: controller),
      ),
    );

    await tester.tap(find.text('Enviar nota para fila'));
    await tester.pumpAndSettle();

    expect(
      find.textContaining('Nao foi possivel processar o recibo agora.'),
      findsOneWidget,
    );
  });
}
