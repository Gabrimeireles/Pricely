enum ReceiptSubmissionState {
  idle,
  submitting,
  success,
  failure,
}

class ReceiptSubmissionSummary {
  const ReceiptSubmissionSummary({
    required this.storeName,
    required this.ingestedItems,
    required this.lowConfidenceItems,
  });

  final String storeName;
  final int ingestedItems;
  final List<String> lowConfidenceItems;
}
