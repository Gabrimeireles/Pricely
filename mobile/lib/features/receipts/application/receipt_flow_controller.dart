import 'package:flutter/foundation.dart';

import '../../optimization/data/demo_grocery_workflow_gateway.dart';
import '../domain/receipt_submission.dart';

class ReceiptFlowController extends ChangeNotifier {
  ReceiptFlowController(this._workflowGateway);

  final DemoGroceryWorkflowGateway _workflowGateway;

  ReceiptSubmissionState _state = ReceiptSubmissionState.idle;
  ReceiptSubmissionSummary? _lastSubmission;
  String? _errorMessage;

  ReceiptSubmissionState get state => _state;
  ReceiptSubmissionSummary? get lastSubmission => _lastSubmission;
  String? get errorMessage => _errorMessage;

  Future<void> submitReceipt({
    required String storeName,
    required String rawReceipt,
  }) async {
    _state = ReceiptSubmissionState.submitting;
    _errorMessage = null;
    notifyListeners();

    try {
      _lastSubmission = await _workflowGateway.submitReceipt(
        storeName: storeName,
        rawReceipt: rawReceipt,
      );
      _state = ReceiptSubmissionState.success;
    } catch (_) {
      _state = ReceiptSubmissionState.failure;
      _errorMessage = 'Nao foi possivel processar o recibo agora.';
    }

    notifyListeners();
  }
}
