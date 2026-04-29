import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../../auth/application/auth_controller.dart';
import '../../optimization/application/optimization_controller.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../application/shopping_list_controller.dart';

class ShoppingListScreen extends StatefulWidget {
  const ShoppingListScreen({
    required this.controller,
    required this.optimizationController,
    required this.authController,
    super.key,
  });

  final ShoppingListController controller;
  final OptimizationController optimizationController;
  final AuthController authController;

  @override
  State<ShoppingListScreen> createState() => _ShoppingListScreenState();
}

class _ShoppingListScreenState extends State<ShoppingListScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _itemController;
  late final TextEditingController _quantityController;
  late final TextEditingController _unitController;
  late final TextEditingController _preferredBrandController;
  String? _selectedCatalogProductId;
  String? _selectedVariantId;
  String _brandPreferenceMode = 'any';

  @override
  void initState() {
    super.initState();
    _titleController =
        TextEditingController(text: widget.controller.draft.title);
    _itemController = TextEditingController();
    _quantityController = TextEditingController(text: '1');
    _unitController = TextEditingController(text: 'un');
    _preferredBrandController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _itemController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    _preferredBrandController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pricely'),
        actions: <Widget>[
          AnimatedBuilder(
            animation: widget.authController,
            builder: (context, _) {
              if (!widget.authController.isAuthenticated) {
                return TextButton(
                  onPressed: () =>
                      Navigator.of(context).pushNamed(AppRouter.authRoute),
                  child: const Text('Entrar'),
                );
              }

              return PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'logout') {
                    await widget.authController.signOut();
                    await widget.controller.loadDraft();
                  }
                },
                itemBuilder: (context) => <PopupMenuEntry<String>>[
                  const PopupMenuItem<String>(
                    value: 'logout',
                    child: Text('Sair'),
                  ),
                ],
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Center(
                    child: Text(
                        widget.authController.currentUser?.displayName ??
                            'Conta'),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: Listenable.merge(<Listenable>[
          widget.authController,
          widget.controller,
          widget.optimizationController,
        ]),
        builder: (context, _) {
          final draft = widget.controller.draft;
          _titleController.value = _titleController.value.copyWith(
            text: draft.title,
            selection: TextSelection.collapsed(offset: draft.title.length),
          );

          if (!widget.authController.isAuthenticated) {
            return _UnauthenticatedView(
              onSignIn: () =>
                  Navigator.of(context).pushNamed(AppRouter.authRoute),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Ola, ${widget.authController.currentUser?.displayName ?? 'cliente'}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${widget.authController.currentUser?.shoppingListsCount ?? 0} listas sincronizadas · economia estimada ${_formatCurrency(widget.authController.currentUser?.totalEstimatedSavings ?? 0)}',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (widget.controller.lists.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          'Listas salvas',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: draft.id,
                          items: widget.controller.lists
                              .map(
                                (list) => DropdownMenuItem<String>(
                                  value: list.id,
                                  child: Text(list.title),
                                ),
                              )
                              .toList(),
                          onChanged: widget.controller.selectList,
                          decoration: const InputDecoration(
                            labelText: 'Lista ativa',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: widget.controller.startNewList,
                          child: const Text('Criar nova lista'),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              TextField(
                controller: _titleController,
                onChanged: widget.controller.updateTitle,
                decoration: const InputDecoration(
                  labelText: '1. Nome da lista',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '2. Escolha um produto comparavel',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Pesquise o produto base primeiro. A preferencia de marca entra depois, se fizer sentido.',
                    ),
                    const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    flex: 3,
                    child: TextField(
                      controller: _itemController,
                      onChanged: widget.controller.searchCatalog,
                      decoration: const InputDecoration(
                        labelText: 'Produto',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _quantityController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Qtd',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _unitController,
                      decoration: const InputDecoration(
                        labelText: 'Un',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (widget.controller.catalogResults.isNotEmpty)
                DropdownButtonFormField<String>(
                  initialValue: _selectedCatalogProductId,
                  items: widget.controller.catalogResults
                      .map(
                        (product) => DropdownMenuItem<String>(
                          value: product.id,
                          child: Text(product.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) async {
                    setState(() {
                      _selectedCatalogProductId = value;
                      _selectedVariantId = null;
                    });
                    if (value != null) {
                      await widget.controller.loadVariants(value);
                    }
                  },
                  decoration: const InputDecoration(
                    labelText: 'Produto comparavel',
                    border: OutlineInputBorder(),
                  ),
                ),
              if (widget.controller.catalogResults.isNotEmpty)
                const SizedBox(height: 12),
              if (_selectedCatalogProductId != null) ...<Widget>[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          'Regra atual: ${_brandPreferenceSummary()}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                      OutlinedButton(
                        onPressed: _openBrandPreferenceSheet,
                        child: const Text('Configurar marca'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    if (_selectedCatalogProductId == null) {
                      return;
                    }

                    CatalogProductSummary? selectedProduct;
                    for (final product in widget.controller.catalogResults) {
                      if (product.id == _selectedCatalogProductId) {
                        selectedProduct = product;
                        break;
                      }
                    }

                    ProductVariantSummary? selectedVariant;
                    for (final variant in widget.controller.variantResults) {
                      if (variant.id == _selectedVariantId) {
                        selectedVariant = variant;
                        break;
                      }
                    }

                    await widget.controller.addItem(
                      name: _itemController.text,
                      catalogProductId: _selectedCatalogProductId,
                      lockedProductVariantId:
                          _brandPreferenceMode == 'exact'
                              ? _selectedVariantId
                              : null,
                      brandPreferenceMode: _brandPreferenceMode,
                      preferredBrandNames: _brandPreferenceMode == 'preferred' &&
                              _preferredBrandController.text.trim().isNotEmpty
                          ? <String>[_preferredBrandController.text.trim()]
                          : const <String>[],
                      imageUrl: selectedVariant?.imageUrl ?? selectedProduct?.imageUrl,
                      quantity: int.tryParse(_quantityController.text) ?? 1,
                      unit: _unitController.text.trim().isEmpty
                          ? 'un'
                          : _unitController.text.trim(),
                    );
                    _itemController.clear();
                    _quantityController.text = '1';
                    _unitController.text = 'un';
                    _preferredBrandController.clear();
                    setState(() {
                      _selectedCatalogProductId = null;
                      _selectedVariantId = null;
                      _brandPreferenceMode = 'any';
                    });
                  },
                  child: Text(
                    _selectedCatalogProductId == null
                        ? 'Escolha um produto base para adicionar'
                        : 'Adicionar item',
                  ),
                ),
              ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (draft.items.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      '3. Revise os itens adicionados. A lista sera salva no backend e pode ser reutilizada antes ou depois da otimizacao.',
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
                              leading: SizedBox(
                                width: 52,
                                height: 52,
                                child: item.imageUrl != null
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          item.imageUrl!,
                                          width: 52,
                                          height: 52,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const DecoratedBox(
                                            decoration: BoxDecoration(
                                              color: Color(0xFFE6F4F1),
                                              borderRadius: BorderRadius.all(Radius.circular(8)),
                                            ),
                                            child: Icon(Icons.shopping_basket_outlined),
                                          ),
                                        ),
                                      )
                                    : const Icon(Icons.shopping_basket_outlined),
                              ),
                              title: Text(item.name),
                              subtitle: Text(
                                '${item.quantity} ${item.unit} - ${item.brandPreferenceMode == 'any' ? 'qualquer marca' : item.brandPreferenceMode == 'preferred' ? 'preferir ${item.preferredBrandNames.join(', ')}' : 'variante exata'}',
                              ),
                              trailing: Wrap(
                                spacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: <Widget>[
                                  Checkbox(
                                    value: item.purchaseStatus == 'purchased',
                                    onChanged: (_) =>
                                        widget.controller.togglePurchased(item.id),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline),
                                    onPressed: () =>
                                        widget.controller.removeItem(item.id),
                                  ),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
              if (widget.controller.errorMessage != null) ...<Widget>[
                const SizedBox(height: 16),
                Text(
                  widget.controller.errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: widget.controller.isSyncing
                          ? null
                          : () async {
                              await widget.controller.saveDraft();
                            },
                      child: Text(
                        widget.controller.isSyncing
                            ? 'Salvando...'
                            : 'Salvar lista',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () async {
                        await widget.controller.saveDraft();
                        if (!context.mounted) {
                          return;
                        }
                        Navigator.of(context)
                            .pushNamed(AppRouter.optimizationRoute);
                      },
                      child: const Text('Otimizar'),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: widget.authController.isAuthenticated
            ? () => Navigator.of(context).pushNamed(AppRouter.receiptsRoute)
            : null,
        icon: const Icon(Icons.receipt_long_outlined),
        label: const Text('Recibos'),
      ),
    );
  }

  String _formatCurrency(double value) {
    return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  String _brandPreferenceSummary() {
    if (_brandPreferenceMode == 'exact') {
      return _selectedVariantId == null || _selectedVariantId!.isEmpty
          ? 'variante exata pendente'
          : 'variante exata selecionada';
    }

    if (_brandPreferenceMode == 'preferred') {
      return _preferredBrandController.text.trim().isEmpty
          ? 'preferir marca'
          : 'preferir ${_preferredBrandController.text.trim()}';
    }

    return 'qualquer marca';
  }

  Future<void> _openBrandPreferenceSheet() async {
    if (_selectedCatalogProductId == null) {
      return;
    }

    String tempMode = _brandPreferenceMode;
    String tempPreferredBrand = _preferredBrandController.text;
    String? tempVariantId = _selectedVariantId;

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Configurar marca',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: tempMode,
                    items: const <DropdownMenuItem<String>>[
                      DropdownMenuItem<String>(
                        value: 'any',
                        child: Text('Qualquer marca'),
                      ),
                      DropdownMenuItem<String>(
                        value: 'preferred',
                        child: Text('Preferir marca'),
                      ),
                      DropdownMenuItem<String>(
                        value: 'exact',
                        child: Text('Somente variante exata'),
                      ),
                    ],
                    onChanged: (value) {
                      setSheetState(() {
                        tempMode = value ?? 'any';
                      });
                    },
                    decoration: const InputDecoration(
                      labelText: 'Regra de marca',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (tempMode == 'preferred') ...<Widget>[
                    const SizedBox(height: 12),
                    TextField(
                      controller: TextEditingController(text: tempPreferredBrand)
                        ..selection = TextSelection.collapsed(offset: tempPreferredBrand.length),
                      onChanged: (value) => tempPreferredBrand = value,
                      decoration: const InputDecoration(
                        labelText: 'Marca preferida',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                  if (tempMode == 'exact' && widget.controller.variantResults.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: tempVariantId,
                      items: widget.controller.variantResults
                          .map(
                            (variant) => DropdownMenuItem<String>(
                              value: variant.id,
                              child: Text(
                                variant.brandName == null
                                    ? variant.displayName
                                    : '${variant.brandName} - ${variant.displayName}',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setSheetState(() {
                          tempVariantId = value;
                        });
                      },
                      decoration: const InputDecoration(
                        labelText: 'Variante exata',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        setState(() {
                          _brandPreferenceMode = tempMode;
                          _preferredBrandController.text = tempPreferredBrand;
                          _selectedVariantId = tempVariantId;
                        });
                        Navigator.of(sheetContext).pop();
                      },
                      child: const Text('Aplicar'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _UnauthenticatedView extends StatelessWidget {
  const _UnauthenticatedView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Economia com evidencia real',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              const Text(
                'Entre para sincronizar suas listas entre mobile e web, salvar compras mensais e rodar a otimizacao no backend.',
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onSignIn,
                  child: const Text('Entrar ou criar conta'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
