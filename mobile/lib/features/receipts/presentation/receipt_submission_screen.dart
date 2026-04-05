import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../application/receipt_flow_controller.dart';
import '../domain/receipt_submission.dart';

class ReceiptSubmissionScreen extends StatefulWidget {
  const ReceiptSubmissionScreen({
    required this.controller,
    super.key,
  });

  final ReceiptFlowController controller;

  @override
  State<ReceiptSubmissionScreen> createState() =>
      _ReceiptSubmissionScreenState();
}

class _ReceiptSubmissionScreenState extends State<ReceiptSubmissionScreen> {
  late final TextEditingController _storeController;
  late final TextEditingController _receiptController;

  @override
  void initState() {
    super.initState();
    _storeController = TextEditingController(text: 'Mercado Azul');
    _receiptController = TextEditingController(
      text: 'Arroz 22.90\nFeijao 9.40\nBanana 4.90',
    );
  }

  @override
  void dispose() {
    _storeController.dispose();
    _receiptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enviar recibo'),
      ),
      body: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          final submission = widget.controller.lastSubmission;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              TextField(
                controller: _storeController,
                decoration: const InputDecoration(
                  labelText: 'Nome da loja',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _receiptController,
                minLines: 6,
                maxLines: 10,
                decoration: const InputDecoration(
                  labelText: 'Itens do recibo (um por linha com preco no fim)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: widget.controller.state ==
                        ReceiptSubmissionState.submitting
                    ? null
                    : () async {
                        await widget.controller.submitReceipt(
                          storeName: _storeController.text.trim(),
                          rawReceipt: _receiptController.text,
                        );
                        if (!context.mounted) {
                          return;
                        }
                        if (widget.controller.state ==
                            ReceiptSubmissionState.success) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Recibo processado com sucesso.'),
                            ),
                          );
                        }
                      },
                icon: const Icon(Icons.receipt_long),
                label: const Text('Processar recibo'),
              ),
              const SizedBox(height: 16),
              if (submission != null)
                _SubmissionSummaryCard(summary: submission),
              if (widget.controller.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    widget.controller.errorMessage!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            Navigator.of(context).pushNamed(AppRouter.optimizationRoute),
        icon: const Icon(Icons.shopping_bag),
        label: const Text('Ver resultado'),
      ),
    );
  }
}

class _SubmissionSummaryCard extends StatelessWidget {
  const _SubmissionSummaryCard({
    required this.summary,
  });

  final ReceiptSubmissionSummary summary;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              summary.storeName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text('${summary.ingestedItems} itens ingeridos'),
            if (summary.lowConfidenceItems.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                'Baixa confianca: ${summary.lowConfidenceItems.join(', ')}',
              ),
            ],
          ],
        ),
      ),
    );
  }
}
