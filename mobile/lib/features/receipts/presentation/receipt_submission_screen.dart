import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../application/receipt_flow_controller.dart';
import '../domain/receipt_submission.dart';
import 'receipt_qr_scanner_screen.dart';

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
    _storeController = TextEditingController();
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
      appBar: AppBar(title: const Text('Enviar nota fiscal')),
      body: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          final submission = widget.controller.lastSubmission;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Text(
                'Leia ou cole a URL do QR Code da NFC-e. A nota aguarda liberacao administrativa antes de atualizar precos e validar recompensas.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _storeController,
                decoration: const InputDecoration(
                  labelText: 'Nome da loja (opcional)',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _qrCodeController,
                decoration: const InputDecoration(
                  labelText: 'URL do QR Code da NFC-e',
                  hintText: 'https://www.fazenda.../qrcode?p=...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final scannedUrl = await Navigator.of(context).push<String>(
                    MaterialPageRoute<String>(
                      builder: (_) => const ReceiptQrScannerScreen(),
                    ),
                  );
                  if (scannedUrl != null) {
                    _qrCodeController.text = scannedUrl;
                  }
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Ler QR Code com a camera'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _receiptController,
                minLines: 4,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Itens manuais opcionais',
                  hintText: 'Arroz 22.90\nFeijao 9.40',
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed:
                    widget.controller.state == ReceiptSubmissionState.submitting
                        ? null
                        : () => _submit(context),
                icon: const Icon(Icons.receipt_long),
                label: Text(
                  widget.controller.state == ReceiptSubmissionState.submitting
                      ? 'Enviando...'
                      : 'Enviar nota para fila',
                ),
              ),
              const SizedBox(height: 16),
              if (submission != null)
                _SubmissionSummaryCard(
                  summary: submission,
                  isRefreshing: widget.controller.isRefreshing,
                  onRefresh: widget.controller.refreshLastSubmission,
                ),
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

  Future<void> _submit(BuildContext context) async {
    final qrCodeUrl = _qrCodeController.text.trim();
    if (qrCodeUrl.isNotEmpty && !isValidReceiptQrUrl(qrCodeUrl)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Informe uma URL valida de NFC-e.')),
      );
      return;
    }

    await widget.controller.submitReceipt(
      storeName: _storeController.text.trim(),
      rawReceipt: _receiptController.text,
      qrCodeUrl: qrCodeUrl,
    );
    if (!context.mounted ||
        widget.controller.state != ReceiptSubmissionState.success) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Nota enviada e aguardando liberacao.'),
      ),
    );
  }
}

class _SubmissionSummaryCard extends StatelessWidget {
  const _SubmissionSummaryCard({
    required this.summary,
    required this.isRefreshing,
    required this.onRefresh,
  });

  final ReceiptSubmissionSummary summary;
  final bool isRefreshing;
  final Future<void> Function() onRefresh;

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
            if (summary.qrCodeUrl?.isNotEmpty ?? false)
              const Text('Origem: QR Code NFC-e'),
            Text('${summary.ingestedItems} itens recebidos'),
            const SizedBox(height: 8),
            Text('Fila: ${_processingLabel(summary.processingStatus)}'),
            Text('Moderacao: ${summary.moderationStatus}'),
            Text('Recompensa: ${_rewardLabel(summary.rewardEligibilityStatus)}'),
            if (summary.rewardPoints > 0 ||
                summary.rewardOptimizationTokens > 0)
              Text(
                '${summary.rewardPoints} pontos, ${summary.rewardOptimizationTokens} creditos',
              ),
            Text(summary.rewardMessage),
            if (summary.lowConfidenceItems.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                'Baixa confianca: ${summary.lowConfidenceItems.join(', ')}',
              ),
            ],
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: isRefreshing ? null : onRefresh,
              icon: isRefreshing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: const Text('Atualizar andamento'),
            ),
          ],
        ),
      ),
    );
  }

  String _processingLabel(String status) {
    return switch (status) {
      'waiting_manual_release' => 'aguardando liberacao manual',
      'queued' => 'liberada para processamento',
      'running' => 'processando',
      'completed' => 'processada',
      'failed' => 'falhou',
      'retrying' => 'tentando novamente',
      _ => status,
    };
  }

  String _rewardLabel(String status) {
    return switch (status) {
      'granted' => 'validada',
      'eligible_pending' => 'em validacao',
      'ineligible' => 'nao elegivel',
      'disabled' => 'desativada',
      _ => status,
    };
  }
}
