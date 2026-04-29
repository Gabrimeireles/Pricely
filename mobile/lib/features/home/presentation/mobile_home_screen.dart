import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../../auth/application/auth_controller.dart';
import '../../discovery/application/market_discovery_controller.dart';
import '../../optimization/application/optimization_controller.dart';
import '../../optimization/domain/optimization_result.dart';
import '../../receipts/application/receipt_flow_controller.dart';
import '../../receipts/domain/receipt_submission.dart';
import '../../shared/data/pricely_backend_gateway.dart';
import '../../shopping_lists/application/shopping_list_controller.dart';
import '../../shopping_lists/presentation/shopping_list_screen.dart';

class MobileHomeScreen extends StatefulWidget {
  const MobileHomeScreen({
    required this.authController,
    required this.discoveryController,
    required this.shoppingListController,
    required this.optimizationController,
    required this.receiptFlowController,
    super.key,
  });

  final AuthController authController;
  final MarketDiscoveryController discoveryController;
  final ShoppingListController shoppingListController;
  final OptimizationController optimizationController;
  final ReceiptFlowController receiptFlowController;

  @override
  State<MobileHomeScreen> createState() => _MobileHomeScreenState();
}

class _MobileHomeScreenState extends State<MobileHomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    if (widget.discoveryController.regions.isEmpty) {
      widget.discoveryController.loadInitialData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge(<Listenable>[
        widget.authController,
        widget.discoveryController,
        widget.shoppingListController,
        widget.optimizationController,
        widget.receiptFlowController,
      ]),
      builder: (context, _) {
        final pages = <Widget>[
          _HomeTab(
            authController: widget.authController,
            discoveryController: widget.discoveryController,
            shoppingListController: widget.shoppingListController,
            onOpenAuth: () =>
                Navigator.of(context).pushNamed(AppRouter.authRoute),
            onOpenList: () => setState(() => _currentIndex = 1),
            onOpenResults: () => setState(() => _currentIndex = 2),
          ),
          ShoppingListScreen(
            authController: widget.authController,
            controller: widget.shoppingListController,
            optimizationController: widget.optimizationController,
          ),
          _OptimizationTab(
            authController: widget.authController,
            controller: widget.optimizationController,
            listController: widget.shoppingListController,
          ),
          _ReceiptTab(controller: widget.receiptFlowController),
          _ProfileTab(
            authController: widget.authController,
            onOpenAuth: () =>
                Navigator.of(context).pushNamed(AppRouter.authRoute),
          ),
        ];

        return Scaffold(
          body: SafeArea(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: KeyedSubtree(
                key: ValueKey<int>(_currentIndex),
                child: pages[_currentIndex],
              ),
            ),
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) => setState(() {
              _currentIndex = index;
            }),
            destinations: const <NavigationDestination>[
              NavigationDestination(
                icon: Icon(Icons.storefront_outlined),
                selectedIcon: Icon(Icons.storefront),
                label: 'Início',
              ),
              NavigationDestination(
                icon: Icon(Icons.list_alt_outlined),
                selectedIcon: Icon(Icons.list_alt),
                label: 'Lista',
              ),
              NavigationDestination(
                icon: Icon(Icons.auto_graph_outlined),
                selectedIcon: Icon(Icons.auto_graph),
                label: 'Resultado',
              ),
              NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long),
                label: 'Recibos',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Perfil',
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.authController,
    required this.discoveryController,
    required this.shoppingListController,
    required this.onOpenAuth,
    required this.onOpenList,
    required this.onOpenResults,
  });

  final AuthController authController;
  final MarketDiscoveryController discoveryController;
  final ShoppingListController shoppingListController;
  final VoidCallback onOpenAuth;
  final VoidCallback onOpenList;
  final VoidCallback onOpenResults;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final region = discoveryController.selectedRegion;
    final user = authController.currentUser;

    return RefreshIndicator(
      onRefresh: discoveryController.refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      user == null
                          ? 'Precos com contexto real'
                          : 'Ola, ${user.displayName}',
                      style: theme.textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      user == null
                          ? 'Escolha a cidade ativa, veja ofertas do dia e monte sua lista com a mesma conta do web.'
                          : 'Sua conta e a mesma no web e no mobile. Ajuste a cidade, monte a lista e acompanhe as melhores ofertas do dia.',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (user == null)
                FilledButton(
                  onPressed: onOpenAuth,
                  child: const Text('Entrar'),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: <Color>[Color(0xFF005C55), Color(0xFF0F766E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Economia estimada',
                  style: theme.textTheme.labelLarge
                      ?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Text(
                  _formatCurrency(user?.totalEstimatedSavings ?? 0),
                  style: theme.textTheme.displaySmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: <Widget>[
                    _SignalChip(
                      label: '${user?.shoppingListsCount ?? 0} listas',
                      foreground: Colors.white,
                      background: Colors.white24,
                    ),
                    _SignalChip(
                      label: region == null
                          ? 'Sem cidade carregada'
                          : '${region.name} · ${region.activeEstablishmentCount} lojas',
                      foreground: Colors.white,
                      background: Colors.white24,
                    ),
                    _SignalChip(
                      label: region?.offerCoverageStatus == 'collecting_data'
                          ? 'Cobertura em coleta'
                          : 'Ofertas ao vivo',
                      foreground: Colors.white,
                      background: Colors.white24,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Escolha sua cidade', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: region?.slug,
                  items: discoveryController.regions
                      .map(
                        (entry) => DropdownMenuItem<String>(
                          value: entry.slug,
                          child: Text(
                              '${entry.name} - ${entry.activeEstablishmentCount} estabelecimentos'),
                        ),
                      )
                      .toList(),
                  onChanged: discoveryController.selectRegion,
                  decoration: const InputDecoration(
                    labelText: 'Cidade ativa',
                  ),
                ),
                if (region != null) ...<Widget>[
                  const SizedBox(height: 12),
                  Text(
                    region.activeEstablishmentCount == 0
                        ? 'Ainda nao temos estabelecimentos ativos nessa cidade. Voce pode trocar de cidade ou comecar a contribuir com recibos.'
                        : region.offerCoverageStatus == 'collecting_data'
                            ? 'A cidade ja esta aberta, mas a cobertura ainda esta sendo populada. Os precos podem ser parciais.'
                            : 'Cidade com ofertas disponiveis e estabelecimentos ativos.',
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: <Widget>[
              Expanded(
                child: _ActionCard(
                  title: 'Minha lista',
                  description: 'Monte, salve e reuse sua compra mensal.',
                  icon: Icons.playlist_add_check_circle_outlined,
                  onTap: onOpenList,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                    child: _ActionCard(
                      title: 'Resultado',
                      description: 'Compare deslocamento, cobertura e menor total antes de comprar.',
                      icon: Icons.auto_graph_outlined,
                      onTap: onOpenResults,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Ofertas por cidade',
                  style: theme.textTheme.titleLarge,
                ),
              ),
              if (discoveryController.isLoading)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          if (discoveryController.errorMessage != null) ...<Widget>[
            const SizedBox(height: 12),
            Text(
              discoveryController.errorMessage!,
              style: TextStyle(color: theme.colorScheme.error),
            ),
          ],
          const SizedBox(height: 12),
          if (discoveryController.offers.isEmpty)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFEBF6F1),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Text(
                'Sem ofertas suficientes nesta cidade no momento.',
              ),
            )
          else
            Column(
              children: discoveryController.offers
                  .take(6)
                  .map(
                    (offer) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _OfferCard(
                        offer: offer,
                        onTap: () => _showOfferDetail(
                          context,
                          discoveryController,
                          offer.id,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }

  Future<void> _showOfferDetail(
    BuildContext context,
    MarketDiscoveryController discoveryController,
    String offerId,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) {
        return FutureBuilder<PublicOfferDetail>(
          future: discoveryController.fetchOfferDetail(offerId),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (snapshot.hasError || !snapshot.hasData) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Text('Nao foi possivel carregar o detalhe da oferta agora.'),
              );
            }

            final detail = snapshot.data!;
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    detail.productName,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 6),
                  Text(detail.category),
                  const SizedBox(height: 6),
                  Text(
                    'Use este detalhe para comparar loja principal, alternativas e embalagem.',
                  ),
                  const SizedBox(height: 16),
                  _OfferDetailRow(
                    title: 'Melhor oferta agora',
                    offer: detail.activeOffer,
                  ),
                  if (detail.alternativeOffers.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 16),
                    Text(
                      'Outras lojas',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 10),
                    ...detail.alternativeOffers.map(
                      (offer) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _OfferDetailRow(
                          title: offer.storeName,
                          offer: offer,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _ShoppingListTab extends StatefulWidget {
  const _ShoppingListTab({
    required this.authController,
    required this.controller,
    required this.onOpenAuth,
  });

  final AuthController authController;
  final ShoppingListController controller;
  final VoidCallback onOpenAuth;

  @override
  State<_ShoppingListTab> createState() => _ShoppingListTabState();
}

class _ShoppingListTabState extends State<_ShoppingListTab> {
  late final TextEditingController _titleController;
  late final TextEditingController _itemController;
  late final TextEditingController _quantityController;
  late final TextEditingController _unitController;

  @override
  void initState() {
    super.initState();
    _titleController =
        TextEditingController(text: widget.controller.draft.title);
    _itemController = TextEditingController();
    _quantityController = TextEditingController(text: '1');
    _unitController = TextEditingController(text: 'un');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _itemController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final draft = widget.controller.draft;
    _titleController.value = _titleController.value.copyWith(
      text: draft.title,
      selection: TextSelection.collapsed(offset: draft.title.length),
    );

    if (!widget.authController.isAuthenticated) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          Text('Minha lista', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 12),
          const Text(
            'Entre para sincronizar listas entre web e mobile e reaproveitar compras recorrentes.',
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: widget.onOpenAuth,
            child: const Text('Entrar na conta'),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Text('Minha lista', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'Salve sem processar agora e rode a otimização quando quiser.',
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 18),
        if (widget.controller.lists.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Listas salvas', style: theme.textTheme.titleMedium),
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
                  decoration: const InputDecoration(labelText: 'Lista ativa'),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: widget.controller.startNewList,
                  child: const Text('Nova lista'),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),
        TextField(
          controller: _titleController,
          onChanged: widget.controller.updateTitle,
          decoration: const InputDecoration(labelText: 'Nome da lista'),
        ),
        const SizedBox(height: 16),
        Row(
          children: <Widget>[
            Expanded(
              flex: 3,
              child: TextField(
                controller: _itemController,
                decoration: const InputDecoration(labelText: 'Produto'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Qtd'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _unitController,
                decoration: const InputDecoration(labelText: 'Un'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () async {
            await widget.controller.addItem(
              name: _itemController.text,
              quantity: int.tryParse(_quantityController.text) ?? 1,
              unit: _unitController.text.trim().isEmpty
                  ? 'un'
                  : _unitController.text.trim(),
            );
            _itemController.clear();
            _quantityController.text = '1';
            _unitController.text = 'un';
          },
          child: const Text('Adicionar item'),
        ),
        const SizedBox(height: 16),
        if (draft.items.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFEBF6F1),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Text(
              'Sua lista ainda está vazia. Adicione itens e salve para sincronizar no backend.',
            ),
          )
        else
          Column(
            children: draft.items
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(item.name,
                                    style: theme.textTheme.titleMedium),
                                const SizedBox(height: 4),
                                Text('${item.quantity} ${item.unit}'),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () =>
                                widget.controller.removeItem(item.id),
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        if (widget.controller.errorMessage != null) ...<Widget>[
          const SizedBox(height: 12),
          Text(
            widget.controller.errorMessage!,
            style: TextStyle(color: theme.colorScheme.error),
          ),
        ],
        const SizedBox(height: 16),
        Row(
          children: <Widget>[
            Expanded(
              child: OutlinedButton(
                onPressed: widget.controller.isSyncing
                    ? null
                    : widget.controller.saveDraft,
                child: Text(
                    widget.controller.isSyncing ? 'Salvando...' : 'Salvar'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: widget.controller.isSyncing
                    ? null
                    : widget.controller.saveDraft,
                child: const Text('Sincronizar'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _OptimizationTab extends StatelessWidget {
  const _OptimizationTab({
    required this.authController,
    required this.controller,
    required this.listController,
  });

  final AuthController authController;
  final OptimizationController controller;
  final ShoppingListController listController;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final result = controller.result;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Text('Resultados', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text(
          'Compare os modos Local, Global unico e Global completo usando a mesma lista salva.',
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Modo ativo', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F4F2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Local: menos deslocamento.'),
                    SizedBox(height: 6),
                    Text('Global unico: melhor loja unica.'),
                    SizedBox(height: 6),
                    Text('Global completo: menor total, mesmo dividindo a compra.'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const <ButtonSegment<String>>[
                  ButtonSegment<String>(value: 'local', label: Text('Local')),
                  ButtonSegment<String>(
                      value: 'global_unique', label: Text('Global único')),
                  ButtonSegment<String>(
                      value: 'global_full', label: Text('Global completo')),
                ],
                selected: <String>{listController.draft.lastMode},
                onSelectionChanged: (selection) {
                  listController.updateMode(selection.first);
                },
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed:
                    authController.isAuthenticated ? controller.optimize : null,
                icon: const Icon(Icons.auto_graph),
                label: Text(controller.isLoading
                    ? 'Processando...'
                    : 'Rodar otimização'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
          if (controller.errorMessage != null)
            Text(
              controller.errorMessage!,
              style: TextStyle(color: theme.colorScheme.error),
            ),
          if (result != null &&
              (result.status == 'queued' || result.status == 'running'))
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFEBF6F1),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    result.isStale
                        ? 'A lista ainda esta em processamento. Volte em instantes para atualizar o resultado.'
                        : 'O backend aceitou a lista e esta calculando o melhor resultado agora.',
                  ),
                  if (result.isStale) ...<Widget>[
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: controller.optimize,
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ],
              ),
            ),
          if (result == null && !controller.isLoading)
            Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFEBF6F1),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Text(
              'Nenhum resultado calculado ainda. Salve a lista e rode a otimização no backend.',
            ),
          ),
        if (result != null) ...<Widget>[
          const SizedBox(height: 12),
          _ResultSummaryCard(result: result),
          const SizedBox(height: 16),
          ...result.storePlans.map((plan) => _StorePlanCard(plan: plan)),
          if (result.unavailableItems.isNotEmpty) ...<Widget>[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Itens sem oferta', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...result.unavailableItems.map((item) => Text('• $item')),
                ],
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class _ReceiptTab extends StatefulWidget {
  const _ReceiptTab({required this.controller});

  final ReceiptFlowController controller;

  @override
  State<_ReceiptTab> createState() => _ReceiptTabState();
}

class _ReceiptTabState extends State<_ReceiptTab> {
  late final TextEditingController _storeController;
  late final TextEditingController _receiptController;

  @override
  void initState() {
    super.initState();
    _storeController = TextEditingController(text: 'Mercado Azul');
    _receiptController = TextEditingController(
      text: 'Arroz 22.90\nFeijão 9.40\nBanana 4.90',
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
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Text('Enviar contribuição', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text(
          'Envie recibos para ajudar a popular regiões com pouca cobertura. O processamento completo ainda é evolutivo.',
        ),
        const SizedBox(height: 18),
        TextField(
          controller: _storeController,
          decoration: const InputDecoration(labelText: 'Estabelecimento'),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _receiptController,
          minLines: 7,
          maxLines: 12,
          decoration: const InputDecoration(
            labelText: 'Itens do recibo',
            hintText: 'Um item por linha com preço ao final.',
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed:
              widget.controller.state == ReceiptSubmissionState.submitting
                  ? null
                  : () => widget.controller.submitReceipt(
                        storeName: _storeController.text.trim(),
                        rawReceipt: _receiptController.text.trim(),
                      ),
          child: Text(
            widget.controller.state == ReceiptSubmissionState.submitting
                ? 'Enviando...'
                : 'Processar contribuição',
          ),
        ),
        if (widget.controller.errorMessage != null) ...<Widget>[
          const SizedBox(height: 12),
          Text(
            widget.controller.errorMessage!,
            style: TextStyle(color: theme.colorScheme.error),
          ),
        ],
        if (widget.controller.lastSubmission != null) ...<Widget>[
          const SizedBox(height: 18),
          _ReceiptSummaryCard(summary: widget.controller.lastSubmission!),
        ],
      ],
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({
    required this.authController,
    required this.onOpenAuth,
  });

  final AuthController authController;
  final VoidCallback onOpenAuth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = authController.currentUser;

    if (user == null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          Text('Perfil', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 12),
          const Text(
            'Entre para acompanhar economia estimada, listas, contribuições e histórico sincronizado.',
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: onOpenAuth,
            child: const Text('Entrar'),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Text('Perfil', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(user.displayName, style: theme.textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text(user.email),
              const SizedBox(height: 18),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  _MetricTile(
                      label: 'Economia estimada',
                      value: _formatCurrency(user.totalEstimatedSavings)),
                  _MetricTile(
                      label: 'Listas', value: '${user.shoppingListsCount}'),
                  _MetricTile(
                      label: 'Otimizações',
                      value: '${user.completedOptimizationRuns}'),
                  _MetricTile(
                      label: 'Contribuições',
                      value: '${user.contributionsCount}'),
                  _MetricTile(
                      label: 'Recibos',
                      value: '${user.receiptSubmissionsCount}'),
                  _MetricTile(
                      label: 'Reportes', value: '${user.offerReportsCount}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton(
          onPressed: authController.signOut,
          child: const Text('Sair da conta'),
        ),
      ],
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({
    required this.offer,
    required this.onTap,
  });

  final PublicOfferSummary offer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (offer.imageUrl != null && offer.imageUrl!.isNotEmpty) ...<Widget>[
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  offer.imageUrl!,
                  width: double.infinity,
                  height: 172,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 14),
            ],
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(offer.displayName, style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text('${offer.storeName} · ${offer.neighborhood}'),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF487500),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    _formatCurrency(offer.priceAmount),
                    style: theme.textTheme.labelLarge
                        ?.copyWith(color: const Color(0xFFB5FF56)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(offer.packageLabel),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                _SignalChip(
                  label: offer.sourceLabel,
                  foreground: const Color(0xFF005C55),
                  background: const Color(0xFFEBF6F1),
                ),
                _SignalChip(
                  label: offer.confidenceLevel == 'high'
                      ? 'Alta confiança'
                      : offer.confidenceLevel == 'medium'
                          ? 'Confiança média'
                          : 'Baixa confiança',
                  foreground: const Color(0xFF003EA8),
                  background: const Color(0xFFDDE7FF),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OfferDetailRow extends StatelessWidget {
  const _OfferDetailRow({
    required this.title,
    required this.offer,
  });

  final String title;
  final PublicOfferSummary offer;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4F2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(offer.displayName),
          const SizedBox(height: 4),
          Text('${offer.storeName} · ${offer.neighborhood}'),
          const SizedBox(height: 4),
          Text('${offer.packageLabel} · ${offer.sourceLabel}'),
          const SizedBox(height: 8),
          Text(_formatCurrency(offer.priceAmount)),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Icon(icon, color: const Color(0xFF005C55)),
            const SizedBox(height: 12),
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(description),
          ],
        ),
      ),
    );
  }
}

class _SignalChip extends StatelessWidget {
  const _SignalChip({
    required this.label,
    required this.foreground,
    required this.background,
  });

  final String label;
  final Color foreground;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style:
            Theme.of(context).textTheme.labelLarge?.copyWith(color: foreground),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 148,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4F2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text(label),
        ],
      ),
    );
  }
}

class _ResultSummaryCard extends StatelessWidget {
  const _ResultSummaryCard({required this.result});

  final OptimizationResult result;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: <Color>[Color(0xFF005C55), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            result.shoppingListTitle,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 12),
          Text(
            _formatCurrency(result.totalCost),
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Economia estimada ${_formatCurrency(result.estimatedSavings)}',
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class _StorePlanCard extends StatelessWidget {
  const _StorePlanCard({required this.plan});

  final StoreOptimizationPlan plan;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child:
                      Text(plan.storeName, style: theme.textTheme.titleLarge),
                ),
                Text(_formatCurrency(plan.subtotal)),
              ],
            ),
            const SizedBox(height: 12),
            ...plan.selections.map(
              (selection) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(selection.itemName,
                              style: theme.textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(
                              '${selection.quantity} ${selection.unit} • ${selection.confidenceLabel}'),
                        ],
                      ),
                    ),
                    Text(_formatCurrency(selection.subtotal)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReceiptSummaryCard extends StatelessWidget {
  const _ReceiptSummaryCard({required this.summary});

  final ReceiptSubmissionSummary summary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(summary.storeName,
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('${summary.ingestedItems} itens ingeridos'),
          if (summary.lowConfidenceItems.isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text('Baixa confiança: ${summary.lowConfidenceItems.join(', ')}'),
          ],
        ],
      ),
    );
  }
}

String _formatCurrency(double value) {
  return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
}
