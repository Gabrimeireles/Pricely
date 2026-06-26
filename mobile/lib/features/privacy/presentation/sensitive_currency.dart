import 'package:flutter/widgets.dart';

import '../../../app/app_scope.dart';

String formatSensitiveCurrency(BuildContext context, double value) {
  final controller =
      AppScope.maybeOf(context)?.monetaryPrivacyController;
  if (controller != null) {
    return controller.formatCurrency(value);
  }

  return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
}
