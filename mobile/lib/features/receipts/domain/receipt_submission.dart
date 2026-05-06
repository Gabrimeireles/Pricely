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
    required this.moderationStatus,
    required this.reviewReason,
    required this.rewardEligibilityStatus,
  });

  final String storeName;
  final int ingestedItems;
  final List<String> lowConfidenceItems;
  final String moderationStatus;
  final String reviewReason;
  final String rewardEligibilityStatus;
}
