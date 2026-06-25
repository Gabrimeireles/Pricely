enum ReceiptSubmissionState {
  idle,
  submitting,
  success,
  failure,
}

class ReceiptSubmissionSummary {
  const ReceiptSubmissionSummary({
    required this.id,
    required this.storeName,
    required this.ingestedItems,
    required this.lowConfidenceItems,
    required this.moderationStatus,
    required this.processingStatus,
    required this.reviewReason,
    required this.rewardEligibilityStatus,
    required this.rewardPoints,
    required this.rewardOptimizationTokens,
    required this.rewardMessage,
    this.qrCodeUrl,
  });

  final String id;
  final String storeName;
  final int ingestedItems;
  final List<String> lowConfidenceItems;
  final String moderationStatus;
  final String processingStatus;
  final String reviewReason;
  final String rewardEligibilityStatus;
  final int rewardPoints;
  final int rewardOptimizationTokens;
  final String rewardMessage;
  final String? qrCodeUrl;

  factory ReceiptSubmissionSummary.fromJson(
    Map<String, dynamic> json, {
    String? fallbackQrCodeUrl,
  }) {
    return ReceiptSubmissionSummary(
      id: json['id'] as String? ?? '',
      storeName: json['storeName'] as String? ?? 'Nota fiscal enviada',
      ingestedItems: (json['ingestedItems'] as num? ?? 0).toInt(),
      lowConfidenceItems:
          (json['lowConfidenceItems'] as List<dynamic>? ?? <dynamic>[])
              .map((item) => item.toString())
              .toList(),
      moderationStatus: json['moderationStatus'] as String? ?? 'pending',
      processingStatus:
          json['processingStatus'] as String? ?? 'waiting_manual_release',
      reviewReason: json['reviewReason'] as String? ?? 'waiting_manual_release',
      rewardEligibilityStatus:
          json['rewardEligibilityStatus'] as String? ?? 'eligible_pending',
      rewardPoints: (json['rewardPoints'] as num? ?? 0).toInt(),
      rewardOptimizationTokens:
          (json['rewardOptimizationTokens'] as num? ?? 0).toInt(),
      rewardMessage: json['rewardMessage'] as String? ??
          'Recompensa em processamento ate a nota ser validada.',
      qrCodeUrl: json['qrCodeUrl'] as String? ?? fallbackQrCodeUrl,
    );
  }

  bool get isWaitingManualRelease =>
      processingStatus == 'waiting_manual_release';

  bool get isRewardValidated => rewardEligibilityStatus == 'granted';
}
