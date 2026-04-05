import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../../optimization/application/optimization_controller.dart';
import '../application/shopping_list_controller.dart';

class ShoppingListScreen extends StatefulWidget {
  const ShoppingListScreen({
    required this.controller,
    required this.optimizationController,
    super.key,
  });

  final ShoppingListController controller;
  final OptimizationController optimizationController;

  @override
  State<ShoppingListScreen> createState() => _ShoppingListScreenState();
}

class _ShoppingListScreenState extends State<ShoppingListScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _itemController;

  @override
  void initState() {
    super.initState();
    _titleController =
        TextEditingController(text: widget.controller.draft.title);
    _itemController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _itemController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minha lista'),
      ),
      body: AnimatedBuilder(
        animation: Listenable.merge(<Listenable>[
          widget.controller,
          widget.optimizationController,
        ]),
        builder: (context, _) {
          final draft = widget.controller.draft;
          _titleController.value = _titleController.value.copyWith(
            text: draft.title,
            selection: TextSelection.collapsed(offset: draft.title.length),
          );

          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              TextField(
                controller: _titleController,
                onChanged: widget.controller.updateTitle,
                decoration: const InputDecoration(
                  labelText: 'Nome da lista',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: TextField(
                      controller: _itemController,
                      decoration: const InputDecoration(
                        labelText: 'Adicionar item',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: () async {
                      await widget.controller
                          .addItem(name: _itemController.text);
                      _itemController.clear();
                    },
                    child: const Text('Adicionar'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (draft.items.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Monte sua lista aqui. Depois envie recibos para alimentar os precos.',
                    ),
                  ),
                )
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      children: draft.items
                          .map(
                            (item) => ListTile(
                              title: Text(item.name),
                              subtitle: Text('${item.quantity} ${item.unit}'),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () =>
                                    widget.controller.removeItem(item.id),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              if (widget.optimizationController.result != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Ultimo resultado salvo: ${widget.optimizationController.result!.storePlans.length} lojas analisadas.',
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            Navigator.of(context).pushNamed(AppRouter.receiptsRoute),
        icon: const Icon(Icons.arrow_forward),
        label: const Text('Ir para recibos'),
      ),
    );
  }
}
