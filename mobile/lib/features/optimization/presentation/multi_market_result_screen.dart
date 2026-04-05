import 'package:flutter/material.dart';

import '../application/optimization_controller.dart';
import '../domain/optimization_result.dart';

class MultiMarketResultScreen extends StatelessWidget {
  const MultiMarketResultScreen({
    required this.controller,
    super.key,
  });

  final OptimizationController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resultado multi-mercado'),
      ),
      body: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          final result = controller.result;

          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (result == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    const Text(
                      'Nenhum resultado salvo ainda. Rode a otimização depois de enviar pelo menos um recibo.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: controller.optimize,
                      child: const Text('Gerar resultado'),
                    ),
                  ],
                ),
              ),
            );
          }

          return MultiMarketResultView(result: result);
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: controller.optimize,
        label: const Text('Recalcular'),
        icon: const Icon(Icons.auto_graph),
      ),
    );
  }
}

class MultiMarketResultView extends StatelessWidget {
  const MultiMarketResultView({
    required this.result,
    super.key,
  });

  final OptimizationResult result;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  result.shoppingListTitle,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Total otimizado: ${_formatCurrency(result.totalCost)}',
                ),
                Text(
                  'Economia estimada: ${_formatCurrency(result.estimatedSavings)}',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        for (final plan in result.storePlans) ...<Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    plan.storeName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text('Subtotal: ${_formatCurrency(plan.subtotal)}'),
                  const SizedBox(height: 12),
                  for (final selection in plan.selections)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(selection.itemName),
                      subtitle: Text(
                        '${selection.quantity} ${selection.unit} • confianca ${selection.confidenceLabel}',
                      ),
                      trailing: Text(
                        _formatCurrency(selection.subtotal),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (result.unavailableItems.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Itens sem oferta',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  for (final item in result.unavailableItems) Text('• $item'),
                ],
              ),
            ),
          ),
      ],
    );
  }

  String _formatCurrency(double value) {
    return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
  }
}
