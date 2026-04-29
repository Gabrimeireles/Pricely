import 'package:flutter/material.dart';

import '../../shopping_lists/application/shopping_list_controller.dart';
import '../../shopping_lists/domain/shopping_list_draft.dart';
import '../application/optimization_controller.dart';
import '../domain/optimization_result.dart';

class MultiMarketResultScreen extends StatelessWidget {
  const MultiMarketResultScreen({
    required this.controller,
    required this.shoppingListController,
    super.key,
  });

  final OptimizationController controller;
  final ShoppingListController shoppingListController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resultado da otimizacao'),
      ),
      body: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          final result = controller.result;

          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (controller.errorMessage != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      controller.errorMessage!,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: controller.optimize,
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (result == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    const Text(
                      'Nenhum resultado salvo ainda. Rode a otimizacao para comparar lojas, cobertura e menor total.',
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

          return MultiMarketResultView(
            result: result,
            shoppingListController: shoppingListController,
          );
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
    required this.shoppingListController,
    super.key,
  });

  final OptimizationResult result;
  final ShoppingListController shoppingListController;

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
                Text('Total otimizado: ${_formatCurrency(result.totalCost)}'),
                Text(
                  'Economia estimada: ${_formatCurrency(result.estimatedSavings)}',
                ),
                const SizedBox(height: 8),
                Text(
                  'Compare produto, regra de marca, loja sugerida e subtotal por parada.',
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
                    Builder(
                      builder: (context) {
                        final draftItem = _findDraftItem(selection.itemName);

                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: draftItem?.imageUrl != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    draftItem!.imageUrl!,
                                    width: 52,
                                    height: 52,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : null,
                          title: Text(selection.itemName),
                          subtitle: Text(
                            '${selection.quantity} ${selection.unit} - ${_brandRuleLabel(draftItem)} - confianca ${selection.confidenceLabel}',
                          ),
                          trailing: Text(_formatCurrency(selection.subtotal)),
                        );
                      },
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
                  for (final item in result.unavailableItems) Text('- $item'),
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

  ShoppingListItemDraft? _findDraftItem(String itemName) {
    for (final item in shoppingListController.draft.items) {
      if (item.name.trim().toLowerCase() == itemName.trim().toLowerCase()) {
        return item;
      }
    }
    return null;
  }

  String _brandRuleLabel(ShoppingListItemDraft? item) {
    if (item == null || item.brandPreferenceMode == 'any') {
      return 'qualquer marca';
    }
    if (item.brandPreferenceMode == 'exact') {
      return 'variante exata';
    }
    if (item.preferredBrandNames.isEmpty) {
      return 'preferir marca';
    }
    return 'preferir ${item.preferredBrandNames.join(', ')}';
  }
}
