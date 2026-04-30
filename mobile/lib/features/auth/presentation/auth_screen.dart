import 'package:flutter/material.dart';

import '../../../app/router.dart';
import '../application/auth_controller.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    required this.controller,
    super.key,
  });

  final AuthController controller;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final TextEditingController _displayNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isRegister = false;

  @override
  void dispose() {
    _displayNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    try {
      if (_isRegister) {
        await widget.controller.register(
          displayName: _displayNameController.text.trim().isEmpty
              ? 'Cliente Pricely'
              : _displayNameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        await widget.controller.signIn(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      }

      if (!mounted) {
        return;
      }

      Navigator.of(context).pushReplacementNamed(AppRouter.homeRoute);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: AnimatedBuilder(
        animation: widget.controller,
        builder: (context, _) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: <Color>[Color(0xFFF1FCF7), Color(0xFFE6F4F2)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                children: <Widget>[
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.arrow_back),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: <Color>[Color(0xFF005C55), Color(0xFF0F766E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          _isRegister
                              ? 'Criar conta Pricely'
                              : 'Entrar no Pricely',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _isRegister
                              ? 'Use a mesma conta para salvar sua cidade, continuar listas e comprar com checklist no mercado.'
                              : 'Acesse a conta compartilhada para sincronizar listas, cidade e resultados de otimizacao.',
                          style: theme.textTheme.bodyLarge
                              ?.copyWith(color: Colors.white70),
                        ),
                        const SizedBox(height: 18),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: const <Widget>[
                            _HeroChip(label: 'Conta unica'),
                            _HeroChip(label: 'Listas sincronizadas'),
                            _HeroChip(label: 'Cidade e economia'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          _isRegister ? 'Novo cadastro' : 'Acesso do usuario',
                          style: theme.textTheme.titleLarge,
                        ),
                        const SizedBox(height: 18),
                        if (_isRegister) ...<Widget>[
                          TextField(
                            controller: _displayNameController,
                            decoration:
                                const InputDecoration(labelText: 'Nome'),
                          ),
                          const SizedBox(height: 12),
                        ],
                        TextField(
                          controller: _emailController,
                          decoration:
                              const InputDecoration(labelText: 'E-mail'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Senha'),
                        ),
                        if (widget.controller.errorMessage != null) ...<Widget>[
                          const SizedBox(height: 12),
                          Text(
                            widget.controller.errorMessage!,
                            style: TextStyle(color: theme.colorScheme.error),
                          ),
                        ],
                        const SizedBox(height: 18),
                        FilledButton(
                          onPressed:
                              widget.controller.isLoading ? null : _submit,
                          child: Text(
                            widget.controller.isLoading
                                ? 'Processando...'
                                : _isRegister
                                    ? 'Criar conta'
                                    : 'Entrar',
                          ),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _isRegister = !_isRegister;
                            });
                          },
                          child: Text(_isRegister
                              ? 'Ja tenho conta'
                              : 'Criar conta nova'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white24,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context)
            .textTheme
            .labelLarge
            ?.copyWith(color: Colors.white),
      ),
    );
  }
}
