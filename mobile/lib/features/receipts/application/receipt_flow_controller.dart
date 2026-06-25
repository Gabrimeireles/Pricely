import 'package:flutter/foundation.dart';

import '../../auth/application/auth_controller.dart';
import '../../optimization/data/demo_grocery_workflow_gateway.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../domain/receipt_submission.dart';

class ReceiptFlowController extends ChangeNotifier {
  ReceiptFlowController(
    this._workflowGateway, {
    AuthController? authController,
    PricelyBackendGateway? backendGateway,
  })  : _authController = authController,
        _backendGateway = backendGateway;

  final DemoGroceryWorkflowGateway _workflowGateway;
  final AuthController? _authController;
  final PricelyBackendGateway? _backendGateway;

  ReceiptSubmissionState _state = ReceiptSubmissionState.idle;
  ReceiptSubmissionSummary? _lastSubmission;
  String? _errorMessage;
  bool _isRefreshing = false;

  ReceiptSubmissionState get state => _state;
  ReceiptSubmissionSummary? get lastSubmission => _lastSubmission;
  String? get errorMessage => _errorMessage;
  bool get isRefreshing => _isRefreshing;

  Future<void> submitReceipt({
    required String storeName,
    required String rawReceipt,
    String? qrCodeUrl,
  }) async {
    _state = ReceiptSubmissionState.submitting;
    _errorMessage = null;
    notifyListeners();

    try {
      final accessToken = _authController?.accessToken;
      if (_backendGateway != null &&
          accessToken != null &&
          accessToken.isNotEmpty) {
        _lastSubmission = await _backendGateway!.submitReceipt(
          accessToken: accessToken,
          storeName: storeName,
          rawReceipt: rawReceipt,
          qrCodeUrl: qrCodeUrl,
        );
      } else {
        _lastSubmission = await _workflowGateway.submitReceipt(
          storeName: storeName,
          rawReceipt: rawReceipt,
        );
      }
      _state = ReceiptSubmissionState.success;
    } catch (_) {
      _state = ReceiptSubmissionState.failure;
      _errorMessage = 'Nao foi possivel processar o recibo agora.';
    }

    notifyListeners();
  }

  Future<void> refreshLastSubmission() async {
    final submission = _lastSubmission;
    final accessToken = _authController?.accessToken;
    if (submission == null ||
        _backendGateway == null ||
        accessToken == null ||
        accessToken.isEmpty) {
      return;
    }

    _isRefreshing = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _lastSubmission = await _backendGateway!.fetchReceipt(
        accessToken: accessToken,
        receiptId: submission.id,
        fallbackQrCodeUrl: submission.qrCodeUrl,
      );
    } catch (_) {
      _errorMessage = 'Nao foi possivel atualizar o andamento da nota.';
    } finally {
      _isRefreshing = false;
      notifyListeners();
    }
  }
}
