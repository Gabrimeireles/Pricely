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
  late final TextEditingController _qrCodeController;
  late final TextEditingController _receiptController;

  @override
  void initState() {
    super.initState();
    _storeController = TextEditingController(text: 'Mercado Azul');
    _qrCodeController = TextEditingController();
    _receiptController = TextEditingController();
  }

  @override
  void dispose() {
    _storeController.dispose();
    _qrCodeController.dispose();
    _receiptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enviar nota fiscal'),
      ),
      body: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          final submission = widget.controller.lastSubmission;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Text(
                'Leia ou cole a URL do QR Code da NFC-e. A nota fica em fila aguardando liberação manual do admin antes do processamento automático.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _storeController,
                decoration: const InputDecoration(
                  labelText: 'Nome da loja (opcional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _qrCodeController,
                decoration: const InputDecoration(
                  labelText: 'URL do QR Code da NFC-e',
                  hintText: 'https://www.fazenda.../qrcode?p=...',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Leitor de câmera será ativado no app nativo; por enquanto cole a URL lida do QR Code.',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Ler QR Code com a câmera'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _receiptController,
                minLines: 4,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Itens manuais opcionais',
                  hintText: 'Arroz 22.90\nFeijao 9.40',
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
                          qrCodeUrl: _qrCodeController.text.trim(),
                        );
                        if (!context.mounted) {
                          return;
                        }
                        if (widget.controller.state ==
                            ReceiptSubmissionState.success) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Nota enviada para a fila de liberação manual.',
                              ),
                            ),
                          );
                        }
                      },
                icon: const Icon(Icons.receipt_long),
                label: const Text('Enviar nota para fila'),
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
            Text('Protocolo: ${summary.id}'),
            if (summary.qrCodeUrl != null && summary.qrCodeUrl!.isNotEmpty)
              const Text('Origem: QR Code NFC-e'),
            Text('${summary.ingestedItems} itens ingeridos'),
            const SizedBox(height: 8),
            Text('Fila: ${_processingLabel(summary.processingStatus)}'),
            Text('Moderação: ${summary.moderationStatus}'),
            Text('Reward: ${_rewardLabel(summary.rewardEligibilityStatus)}'),
            if (summary.rewardPoints > 0 ||
                summary.rewardOptimizationTokens > 0)
              Text(
                '${summary.rewardPoints} pontos · ${summary.rewardOptimizationTokens} tokens',
              ),
            Text('Motivo: ${summary.reviewReason}'),
            Text(summary.rewardMessage),
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

  String _processingLabel(String status) {
    switch (status) {
      case 'waiting_manual_release':
        return 'aguardando liberação manual';
      case 'queued':
        return 'liberada para processamento';
      case 'running':
        return 'processando';
      case 'completed':
        return 'processada';
      case 'failed':
        return 'falhou';
      case 'retrying':
        return 'tentando novamente';
      default:
        return status;
    }
  }

  String _rewardLabel(String status) {
    switch (status) {
      case 'granted':
        return 'validado';
      case 'eligible_pending':
        return 'em processamento';
      case 'ineligible':
        return 'não elegível';
      case 'disabled':
        return 'desativado';
      default:
        return status;
    }
  }
}
