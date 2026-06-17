import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../../auth/application/auth_controller.dart';
import '../../discovery/application/market_discovery_controller.dart';
import '../../location/application/mobile_location_controller.dart';
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
    required this.locationController,
    super.key,
  });

  final AuthController authController;
  final MarketDiscoveryController discoveryController;
  final ShoppingListController shoppingListController;
  final OptimizationController optimizationController;
  final ReceiptFlowController receiptFlowController;
  final MobileLocationController locationController;

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
        widget.locationController,
      ]),
      builder: (context, _) {
        final user = widget.authController.currentUser;
        if (user != null && (user.preferredRegionSlug == null || user.preferredRegionSlug!.isEmpty)) {
          return _PreferredCityScreen(
            authController: widget.authController,
            discoveryController: widget.discoveryController,
          );
        }

        if (user?.preferredRegionSlug != null &&
            user!.preferredRegionSlug!.isNotEmpty &&
            widget.discoveryController.selectedRegionSlug != user.preferredRegionSlug) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.discoveryController.selectRegion(user.preferredRegionSlug);
          });
        }

        final pages = <Widget>[
          _HomeTab(
            authController: widget.authController,
            discoveryController: widget.discoveryController,
            shoppingListController: widget.shoppingListController,
            optimizationController: widget.optimizationController,
            receiptFlowController: widget.receiptFlowController,
            locationController: widget.locationController,
            onOpenAuth: () =>
                Navigator.of(context).pushNamed(AppRouter.authRoute),
            onOpenList: () => setState(() => _currentIndex = 1),
            onOpenResults: () => setState(() => _currentIndex = 2),
            onOpenReceipts: () => setState(() => _currentIndex = 3),
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
            locationController: widget.locationController,
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

class _PreferredCityScreen extends StatelessWidget {
  const _PreferredCityScreen({
    required this.authController,
    required this.discoveryController,
  });

  final AuthController authController;
  final MarketDiscoveryController discoveryController;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Escolha sua cidade'),
      ),
      body: RefreshIndicator(
        onRefresh: discoveryController.refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: <Widget>[
            Text(
              'Antes de continuar, precisamos salvar sua cidade.',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'A cidade fica persistida na sua conta e pode ser trocada depois quando você quiser.',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 20),
            if (discoveryController.regions.isEmpty && !discoveryController.isLoading)
              OutlinedButton(
                onPressed: discoveryController.loadInitialData,
                child: const Text('Carregar cidades disponíveis'),
              ),
            if (discoveryController.isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              ),
            ...discoveryController.regions.map(
              (region) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () async {
                    await authController.updatePreferredRegion(region.slug);
                    await discoveryController.selectRegion(region.slug);
                  },
                  child: Ink(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: theme.colorScheme.outlineVariant),
                    ),
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                '${region.name} · ${region.stateCode}',
                                style: theme.textTheme.titleMedium,
                              ),
                            ),
                            Text(
                              '${region.activeEstablishmentCount} lojas',
                              style: theme.textTheme.labelMedium,
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          region.offerCoverageStatus == 'collecting_data'
                              ? 'Cidade ativa, ainda coletando cobertura.'
                              : 'Cidade com ofertas e estabelecimentos ativos.',
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({
    required this.authController,
    required this.discoveryController,
    required this.shoppingListController,
    required this.optimizationController,
    required this.receiptFlowController,
    required this.locationController,
    required this.onOpenAuth,
    required this.onOpenList,
    required this.onOpenResults,
    required this.onOpenReceipts,
  });

  final AuthController authController;
  final MarketDiscoveryController discoveryController;
  final ShoppingListController shoppingListController;
  final OptimizationController optimizationController;
  final ReceiptFlowController receiptFlowController;
  final MobileLocationController locationController;
  final VoidCallback onOpenAuth;
  final VoidCallback onOpenList;
  final VoidCallback onOpenResults;
  final VoidCallback onOpenReceipts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final region = discoveryController.selectedRegion;
    final user = authController.currentUser;
    final draft = shoppingListController.draft;
    final activeItems = draft.items.length;
    final result = optimizationController.result;
    final receipt = receiptFlowController.lastSubmission;
    final receiptLabel = receipt == null
        ? 'Aguardando envio'
        : receipt.isWaitingManualRelease
            ? 'Aguardando liberacao'
            : _processingLabel(receipt.processingStatus);
    final hasCity = region != null;
    final hasActiveList = activeItems > 0;

    return RefreshIndicator(
      onRefresh: discoveryController.refresh,
      child: Stack(
        children: <Widget>[
          ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 118),
            children: <Widget>[
              _HomeAccountHeader(
                userName: user?.displayName ?? 'Cliente Pricely',
                cityLabel: hasCity
                    ? '${region.name}, ${region.stateCode}'
                    : 'Escolha sua cidade',
                establishmentLabel: hasCity
                    ? '${region.activeEstablishmentCount} lojas ativas'
                    : 'Sem cidade salva',
                isSignedIn: user != null,
                onOpenAuth: onOpenAuth,
              ),
              const SizedBox(height: 14),
              _HomeSectionCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            'Cidade ativa',
                            style: theme.textTheme.titleMedium,
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
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: region?.slug,
                      items: discoveryController.regions
                          .map(
                            (entry) => DropdownMenuItem<String>(
                              value: entry.slug,
                              child: Text(
                                '${entry.name} - ${entry.activeEstablishmentCount} estabelecimentos',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) async {
                        if (value == null) {
                          return;
                        }
                        await discoveryController.selectRegion(value);
                        if (authController.isAuthenticated) {
                          await authController.updatePreferredRegion(value);
                        }
                      },
                      decoration: const InputDecoration(
                        labelText: 'Cidade ativa',
                      ),
                    ),
                    if (region != null) ...<Widget>[
                      const SizedBox(height: 12),
                      Text(
                        region.activeEstablishmentCount == 0
                            ? 'Ainda não temos estabelecimentos ativos nessa cidade. Você pode trocar de cidade ou começar a contribuir com recibos.'
                            : region.offerCoverageStatus == 'collecting_data'
                                ? 'Cobertura em coleta. Alguns preços podem estar parciais.'
                                : 'Cidade com ofertas disponíveis e estabelecimentos ativos.',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              _CoverageHomeCard(
                authController: authController,
                controller: locationController,
                region: region,
              ),
              const SizedBox(height: 14),
              _NextActionCard(
                title: hasActiveList
                    ? 'Continue sua lista'
                    : hasCity
                        ? 'Monte sua primeira lista'
                        : 'Escolha a cidade',
                description: hasActiveList
                    ? '${draft.title} esta pronta para revisar no mercado.'
                    : hasCity
                        ? 'Adicione produtos comparaveis antes de otimizar.'
                        : 'Salve a cidade para carregar ofertas e lojas.',
                icon: hasActiveList
                    ? Icons.playlist_add_check_circle_outlined
                    : Icons.add_task_outlined,
                onTap: hasCity ? onOpenList : null,
              ),
              const SizedBox(height: 14),
              _HomeSectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            hasActiveList ? draft.title : 'Nenhuma lista ativa',
                            style: theme.textTheme.titleLarge,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _HomeStatusPill(
                          label: hasActiveList
                              ? '$activeItems itens'
                              : '${shoppingListController.lists.length} salvas',
                          foreground: const Color(0xFF005C55),
                          background: const Color(0xFFE0F3EF),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (hasActiveList)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: draft.items.take(4).map((item) {
                          return _HomeStatusPill(
                            label: item.name,
                            foreground: const Color(0xFF3E4947),
                            background: const Color(0xFFF1F4F2),
                          );
                        }).toList(),
                      )
                    else
                      const Text(
                        'Crie uma lista para continuar a compra no celular.',
                      ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: onOpenList,
                        icon: const Icon(Icons.list_alt_outlined),
                        label: Text(
                          hasActiveList ? 'Abrir checklist' : 'Criar lista',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _MetricHomeCard(
                      label: 'Ultima economia',
                      value: result == null
                          ? _formatCurrency(user?.totalEstimatedSavings ?? 0)
                          : _formatCurrency(result.estimatedSavings),
                      detail: result == null
                          ? '${user?.completedOptimizationRuns ?? 0} otimizacoes'
                          : result.shoppingListTitle,
                      icon: Icons.savings_outlined,
                      onTap: onOpenResults,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricHomeCard(
                      label: 'Nota fiscal',
                      value: receiptLabel,
                      detail: receipt == null
                          ? '${user?.receiptSubmissionsCount ?? 0} enviadas'
                          : '${receipt.ingestedItems} itens ingeridos',
                      icon: Icons.receipt_long_outlined,
                      onTap: onOpenReceipts,
                    ),
                  ),
                ],
              ),
              if (optimizationController.errorMessage != null) ...<Widget>[
                const SizedBox(height: 14),
                _InlineStateMessage(
                  icon: Icons.error_outline,
                  message: optimizationController.errorMessage!,
                  color: theme.colorScheme.error,
                ),
              ],
              if (receiptFlowController.state == ReceiptSubmissionState.failure &&
                  receiptFlowController.errorMessage != null) ...<Widget>[
                const SizedBox(height: 14),
                _InlineStateMessage(
                  icon: Icons.error_outline,
                  message: receiptFlowController.errorMessage!,
                  color: theme.colorScheme.error,
                ),
              ],
              if (discoveryController.errorMessage != null) ...<Widget>[
                const SizedBox(height: 14),
                _InlineStateMessage(
                  icon: Icons.wifi_off_outlined,
                  message: discoveryController.errorMessage!,
                  color: theme.colorScheme.error,
                ),
              ],
              const SizedBox(height: 14),
              Row(
                  children: <Widget>[
                    Expanded(
                      child: _QuickActionButton(
                        icon: Icons.local_offer_outlined,
                        label: 'Ofertas',
                        onTap: onOpenResults,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _QuickActionButton(
                        icon: Icons.add_a_photo_outlined,
                        label: 'Enviar nota',
                        onTap: onOpenReceipts,
                      ),
                    ),
                  ],
              ),
              if (discoveryController.offers.isNotEmpty) ...<Widget>[
                const SizedBox(height: 18),
                Text(
                  'Ofertas ativas',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                ...discoveryController.offers.take(3).map(
                      (offer) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _OfferCard(
                          offer: offer,
                          onTap: () => _showOfferDetail(
                            context,
                            discoveryController,
                            offer.id,
                          ),
                        ),
                      ),
                    ),
              ] else ...<Widget>[
                const SizedBox(height: 18),
                _InlineStateMessage(
                  icon: Icons.local_offer_outlined,
                  message: 'Sem ofertas suficientes nesta cidade no momento.',
                  color: const Color(0xFF3E4947),
                ),
              ],
            ],
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 18,
            child: SafeArea(
              top: false,
              child: FilledButton.icon(
                onPressed: optimizationController.isLoading
                    ? null
                    : () async {
                        if (!authController.isAuthenticated) {
                          onOpenAuth();
                          return;
                        }
                        if (!hasActiveList) {
                          onOpenList();
                          return;
                        }
                        await optimizationController.optimize();
                        onOpenResults();
                      },
                icon: optimizationController.isLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.auto_graph_outlined),
                label: Text(
                  optimizationController.isLoading
                      ? 'Otimizando...'
                      : hasActiveList
                          ? 'Otimizar agora'
                          : 'Montar lista',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _processingLabel(String status) {
    switch (status) {
      case 'waiting_manual_release':
        return 'Aguardando liberacao';
      case 'queued':
        return 'Na fila';
      case 'running':
        return 'Processando';
      case 'completed':
        return 'Processada';
      case 'failed':
        return 'Falhou';
      case 'retrying':
        return 'Retentando';
      default:
        return status;
    }
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
                child: Text('Não foi possível carregar o detalhe da oferta agora.'),
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

class _HomeAccountHeader extends StatelessWidget {
  const _HomeAccountHeader({
    required this.userName,
    required this.cityLabel,
    required this.establishmentLabel,
    required this.isSignedIn,
    required this.onOpenAuth,
  });

  final String userName;
  final String cityLabel;
  final String establishmentLabel;
  final bool isSignedIn;
  final VoidCallback onOpenAuth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: <Widget>[
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFF005C55),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(Icons.check, color: Color(0xFFB5FF56)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                userName,
                style: theme.textTheme.titleMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 3),
              Text(
                '$cityLabel - $establishmentLabel',
                style: theme.textTheme.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        if (!isSignedIn)
          TextButton(
            onPressed: onOpenAuth,
            child: const Text('Entrar'),
          ),
      ],
    );
  }
}

class _CoverageHomeCard extends StatelessWidget {
  const _CoverageHomeCard({
    required this.authController,
    required this.controller,
    required this.region,
  });

  final AuthController authController;
  final MobileLocationController controller;
  final PublicRegionSummary? region;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusLabel = _statusLabel(controller.status);
    final preview = controller.coveragePreview;
    final preference = controller.activePreference;
    final coverageCount = preview?.activeEstablishmentCount ??
        (preference?.activeEstablishmentCount ?? region?.activeEstablishmentCount ?? 0);
    final radius = preview?.coverageRadiusKm ??
        (preference?.coverageRadiusKm ?? 5);

    return _HomeSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(Icons.my_location_outlined, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Localização e raio',
                  style: theme.textTheme.titleMedium,
                ),
              ),
              _HomeStatusPill(
                label: statusLabel,
                foreground: _statusColor(controller.status),
                background: const Color(0xFFF1F4F2),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              Expanded(
                child: _HomeMiniMetric(
                  value: '$coverageCount',
                  label: 'lojas em ${radius.toStringAsFixed(0)} km',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _HomeMiniMetric(
                  value: region == null ? 'Cidade' : region!.stateCode,
                  label: region == null ? 'nao selecionada' : region!.name,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            controller.message ??
                (region == null
                    ? 'Escolha uma cidade para carregar o preview local.'
                    : 'Sem localizacao precisa, o app usa apenas a cidade e nao promete proximidade.'),
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: authController.isAuthenticated &&
                      region != null &&
                      !controller.isRequesting
                  ? () => controller.captureAndSave()
                  : null,
              icon: controller.isRequesting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.near_me_outlined),
              label: Text(
                controller.isRequesting
                    ? 'Solicitando...'
                    : 'Usar localização atual',
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _statusLabel(MobileLocationStatus status) {
    switch (status) {
      case MobileLocationStatus.allowed:
        return 'Salva';
      case MobileLocationStatus.denied:
        return 'Negada';
      case MobileLocationStatus.restricted:
        return 'Restrita';
      case MobileLocationStatus.serviceDisabled:
        return 'GPS off';
      case MobileLocationStatus.unavailable:
        return 'Indisp.';
      case MobileLocationStatus.requesting:
        return 'Solicitando';
      case MobileLocationStatus.error:
        return 'Erro';
      case MobileLocationStatus.manual:
        return 'Manual';
    }
  }

  Color _statusColor(MobileLocationStatus status) {
    switch (status) {
      case MobileLocationStatus.allowed:
        return const Color(0xFF005C55);
      case MobileLocationStatus.denied:
      case MobileLocationStatus.restricted:
      case MobileLocationStatus.serviceDisabled:
      case MobileLocationStatus.unavailable:
      case MobileLocationStatus.error:
        return const Color(0xFFB42318);
      case MobileLocationStatus.requesting:
      case MobileLocationStatus.manual:
        return const Color(0xFF003EA8);
    }
  }
}

class _NextActionCard extends StatelessWidget {
  const _NextActionCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF005C55),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: <Widget>[
            Icon(icon, color: const Color(0xFFB5FF56), size: 28),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            const Icon(Icons.chevron_right, color: Colors.white),
          ],
        ),
      ),
    );
  }
}

class _HomeSectionCard extends StatelessWidget {
  const _HomeSectionCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0A141E1B),
            blurRadius: 14,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _MetricHomeCard extends StatelessWidget {
  const _MetricHomeCard({
    required this.label,
    required this.value,
    required this.detail,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String value;
  final String detail;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: theme.colorScheme.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(height: 12),
            Text(
              label,
              style: theme.textTheme.labelLarge,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              detail,
              style: theme.textTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeMiniMetric extends StatelessWidget {
  const _HomeMiniMetric({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4F2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            value,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: theme.textTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _HomeStatusPill extends StatelessWidget {
  const _HomeStatusPill({
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

class _InlineStateMessage extends StatelessWidget {
  const _InlineStateMessage({
    required this.icon,
    required this.message,
    required this.color,
  });

  final IconData icon;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: <Widget>[
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: color,
                  ),
            ),
          ),
        ],
      ),
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
    required this.locationController,
  });

  final AuthController authController;
  final OptimizationController controller;
  final ShoppingListController listController;
  final MobileLocationController locationController;

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
                    Text('Uma loja local: menos deslocamento.'),
                    SizedBox(height: 6),
                    Text('Menor preco local: divide entre lojas no raio.'),
                    SizedBox(height: 6),
                    Text('Menor total cidade: compara toda a cidade.'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const <ButtonSegment<String>>[
                  ButtonSegment<String>(
                      value: 'local_unique', label: Text('Uma loja local')),
                  ButtonSegment<String>(
                      value: 'local_multi', label: Text('Preco local')),
                  ButtonSegment<String>(
                      value: 'global_multi', label: Text('Cidade')),
                ],
                selected: <String>{listController.draft.lastMode},
                onSelectionChanged: (selection) {
                  listController.updateMode(selection.first);
                },
              ),
              const SizedBox(height: 16),
              if (_requiresLocation(listController.draft.lastMode) &&
                  locationController.preferenceIdForRegionSlug(
                        listController.draft.regionId,
                      ) ==
                      null) ...<Widget>[
                Text(
                  'Salve sua localizacao na aba Inicio para usar este modo local.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.error),
                ),
                const SizedBox(height: 12),
              ],
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

  bool _requiresLocation(String mode) {
    return mode == 'local' ||
        mode == 'local_unique' ||
        mode == 'local_multi';
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
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: <Widget>[
        Text('Enviar contribuição', style: theme.textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text(
          'Envie a URL do QR Code da NFC-e. A nota fica aguardando liberação manual do admin antes de reforçar preços e liberar rewards.',
        ),
        const SizedBox(height: 18),
        TextField(
          controller: _storeController,
          decoration:
              const InputDecoration(labelText: 'Estabelecimento opcional'),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _qrCodeController,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(
            labelText: 'URL do QR Code NFC-e',
            hintText: 'https://www.fazenda.../qrcode?p=...',
          ),
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
            hintText: 'Arroz 22.90\nFeijão 9.40',
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
                        qrCodeUrl: _qrCodeController.text.trim(),
                      ),
          child: Text(
            widget.controller.state == ReceiptSubmissionState.submitting
                ? 'Enviando...'
                : 'Enviar nota para fila',
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
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF5F1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFBFD8D0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  _SignalChip(
                    label: user.entitlementPlan == 'premium'
                        ? 'Premium ativo'
                        : 'Plano gratuito',
                    foreground: const Color(0xFF005C55),
                    background: Colors.white,
                  ),
                  _SignalChip(
                    label: user.entitlementPlan == 'premium'
                        ? 'Otimizações ilimitadas'
                        : '${user.availableOptimizationTokens}/${user.monthlyFreeOptimizationTokens} listas no mês',
                    foreground: const Color(0xFF003EA8),
                    background: const Color(0xFFDDE7FF),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('Uso de otimizações', style: theme.textTheme.titleMedium),
              const SizedBox(height: 6),
              const Text(
                'O plano gratuito inclui 2 listas otimizadas por mês. A compra Premium ainda está desativada enquanto o billing é validado.',
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: user.checkoutEnabled ? () {} : null,
                child: const Text('Comprar Premium'),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: <Widget>[
                      if (offer.promotionalPriceAmount != null &&
                          offer.basePriceAmount != null &&
                          offer.basePriceAmount! >
                              offer.promotionalPriceAmount!) ...<Widget>[
                        Text(
                          _formatCurrency(offer.basePriceAmount!),
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: const Color(0xFFE5E7EB),
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                      Text(
                        _formatCurrency(offer.priceAmount),
                        style: theme.textTheme.labelLarge
                            ?.copyWith(color: const Color(0xFFB5FF56)),
                      ),
                    ],
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
          if (offer.promotionalPriceAmount != null &&
              offer.basePriceAmount != null &&
              offer.basePriceAmount! > offer.promotionalPriceAmount!) ...<Widget>[
            Text(
              _formatCurrency(offer.basePriceAmount!),
              style: const TextStyle(decoration: TextDecoration.lineThrough),
            ),
            const SizedBox(height: 2),
          ],
          Text(_formatCurrency(offer.priceAmount)),
          if (offer.savingsVsComparison != null &&
              offer.savingsVsComparison! > 0) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              'Economia de ${_formatCurrency(offer.savingsVsComparison!)} versus outra loja',
            ),
          ],
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

class _LocationPreviewCard extends StatelessWidget {
  const _LocationPreviewCard({
    required this.authController,
    required this.controller,
    required this.region,
  });

  final AuthController authController;
  final MobileLocationController controller;
  final PublicRegionSummary? region;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(Icons.my_location_outlined, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Localização e raio',
                  style: theme.textTheme.titleMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(_coverageSummary),
          const SizedBox(height: 8),
          const Text('Raio local padrao: 5 km.'),
          const SizedBox(height: 8),
          Text(
            controller.message ??
                'Sem localizacao precisa, o app usa apenas a cidade e nao promete proximidade.',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          const Text(
            'Modos locais exigem coordenadas salvas. O fallback manual por cidade compara ofertas da cidade inteira.',
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: <Widget>[
              _SignalChip(
                label: _statusLabel(controller.status),
                foreground: _statusColor(controller.status),
                background: const Color(0xFFF1F4F2),
              ),
              OutlinedButton.icon(
                onPressed: authController.isAuthenticated &&
                        region != null &&
                        !controller.isRequesting
                    ? () => controller.captureAndSave()
                    : null,
                icon: controller.isRequesting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location_outlined),
                label: Text(
                  controller.isRequesting
                      ? 'Solicitando...'
                      : 'Usar localizacao atual',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String get _coverageSummary {
    final activePreference = controller.activePreference;
    final preview = controller.coveragePreview;
    if (preview != null) {
      return 'Preview local: ${preview.activeEstablishmentCount} lojas dentro de ${preview.coverageRadiusKm.toStringAsFixed(0)} km.';
    }

    if (activePreference != null &&
        (region == null || activePreference.regionSlug == region!.slug)) {
      return '${activePreference.activeEstablishmentCount} lojas dentro de ${activePreference.coverageRadiusKm.toStringAsFixed(0)} km.';
    }

    if (region == null) {
      return 'Escolha uma cidade para carregar o preview local.';
    }
    return '${region!.name} - ${region!.stateCode} - ${region!.activeEstablishmentCount} lojas candidatas na cidade.';
  }

  String _statusLabel(MobileLocationStatus status) {
    switch (status) {
      case MobileLocationStatus.allowed:
        return 'Localizacao salva';
      case MobileLocationStatus.denied:
        return 'Permissao negada';
      case MobileLocationStatus.restricted:
        return 'Permissao restrita';
      case MobileLocationStatus.serviceDisabled:
        return 'GPS desligado';
      case MobileLocationStatus.unavailable:
        return 'Indisponivel';
      case MobileLocationStatus.requesting:
        return 'Solicitando';
      case MobileLocationStatus.error:
        return 'Erro';
      case MobileLocationStatus.manual:
        return 'Manual';
    }
  }

  Color _statusColor(MobileLocationStatus status) {
    switch (status) {
      case MobileLocationStatus.allowed:
        return const Color(0xFF005C55);
      case MobileLocationStatus.denied:
      case MobileLocationStatus.restricted:
      case MobileLocationStatus.serviceDisabled:
      case MobileLocationStatus.unavailable:
      case MobileLocationStatus.error:
        return const Color(0xFFB42318);
      case MobileLocationStatus.requesting:
      case MobileLocationStatus.manual:
        return const Color(0xFF003EA8);
    }
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
                            '${selection.quantity} ${selection.unit} - ${_distanceLabel(selection)}',
                          ),
                          Text(_trustEvidenceLabel(selection)),
                          if (selection.selectedVariantName != null)
                            Text('Selecionado: ${selection.selectedVariantName}'),
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

  String _distanceLabel(OptimizationSelection selection) {
    final distance = selection.distanceKm;
    if (distance == null) {
      return 'modo cidade';
    }
    return '${distance.toStringAsFixed(1)} km';
  }

  String _trustEvidenceLabel(OptimizationSelection selection) {
    final source = selection.sourceLabel ?? 'fonte operacional';
    final trustFactor = selection.trustFactor;
    final trustText = trustFactor == null ? '' : ' - trust $trustFactor/100';
    final evidenceCount = selection.trustEvidenceCount ?? 0;
    final evidenceText = evidenceCount == 0
        ? 'sem nota fiscal aceita'
        : evidenceCount == 1
            ? '1 nota fiscal aceita'
            : '$evidenceCount notas fiscais aceitas';
    return 'Confianca da oferta: $source$trustText - $evidenceText';
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
          Text('Protocolo: ${summary.id}'),
          if (summary.qrCodeUrl != null && summary.qrCodeUrl!.isNotEmpty)
            const Text('Origem: QR Code NFC-e'),
          Text('${summary.ingestedItems} itens ingeridos'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              _SignalChip(
                label: 'Fila: ${_processingLabel(summary.processingStatus)}',
                foreground: const Color(0xFF003EA8),
                background: const Color(0xFFDDE7FF),
              ),
              _SignalChip(
                label: 'Moderacao: ${_moderationLabel(summary.moderationStatus)}',
                foreground: const Color(0xFF5C3B00),
                background: const Color(0xFFFFF4D6),
              ),
              _SignalChip(
                label: 'Reward: ${_rewardLabel(summary.rewardEligibilityStatus)}',
                foreground: const Color(0xFF005C55),
                background: const Color(0xFFEAF5F1),
              ),
            ],
          ),
          if (summary.rewardPoints > 0 ||
              summary.rewardOptimizationTokens > 0)
            Text(
              summary.rewardEligibilityStatus == 'granted'
                  ? '${summary.rewardPoints} pontos - ${summary.rewardOptimizationTokens} creditos concedidos'
                  : 'Previsto apos validacao: ${summary.rewardPoints} pontos - ${summary.rewardOptimizationTokens} creditos',
            ),
          Text('Motivo: ${summary.reviewReason}'),
          Text(summary.rewardMessage),
          if (summary.lowConfidenceItems.isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text('Baixa confiança: ${summary.lowConfidenceItems.join(', ')}'),
          ],
        ],
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

  String _moderationLabel(String status) {
    switch (status) {
      case 'accepted':
        return 'aceita';
      case 'duplicate':
        return 'duplicada';
      case 'pending':
        return 'pendente';
      case 'quarantined':
        return 'em revisao';
      case 'rejected':
        return 'rejeitada';
      default:
        return status;
    }
  }
}

String _formatCurrency(double value) {
  return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
}
