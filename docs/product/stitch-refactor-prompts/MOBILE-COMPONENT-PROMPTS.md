# Mobile Component Prompts

Use estes prompts no projeto mobile antes de criar telas.

Regra para todos os componentes:

```text
Crie somente o componente citado. Nao crie tela completa, fluxo completo, telas extras ou variantes nao solicitadas.
Use o contexto de `MOBILE-CONTEXT-PROMPT.md`, `00-system-summary.md` e `00-design-system.md`.
O componente precisa estar pronto para modo claro e modo escuro por tokens.
Use viewport real de telefone, aproximadamente 390px de largura.
Nao crie desktop encolhido. Nao use tabela. Nao cause overflow horizontal.
Touch targets minimos de 44px.
```

## M01 - Mobile App Header

```text
Crie o componente `M01 Mobile App Header`.

Uso:
Topo compacto do app mobile shopper.

Conteudo:
- Pricely icon.
- Titulo curto da area atual.
- Acao de conta/perfil.
- Estado de notificacao discreto quando houver nota/reward pendente.
```

## M02 - Mobile Location Summary

```text
Crie o componente `M02 Mobile Location Summary`.

Uso:
Resumo de cidade/localizacao no mobile.

Estados:
- city-only
- coordenadas precisas com raio 5 km
- CEP fallback
- permissao negada/restrita
- geolocalizacao indisponivel

Conteudo:
- Uma linha principal.
- Uma linha de explicacao.
- Acao pequena para ajustar localizacao.

Regra:
So prometa distancia/proximidade com coordenadas precisas.
```

## M03 - Mobile Bottom Navigation

```text
Crie o componente `M03 Mobile Bottom Navigation`.

Uso:
Navegacao principal mobile quando solicitada em tela.

Itens:
- Inicio
- Listas
- Ofertas
- Notas
- Perfil

Conteudo:
- Icone e label.
- Estado ativo.
- Badge pequeno para nota/reward pendente.
```

## M04 - Mobile Sticky Primary Action

```text
Crie o componente `M04 Mobile Sticky Primary Action`.

Uso:
CTA fixo inferior para a acao principal da tela.

Conteudo:
- Botao primario.
- Acao secundaria opcional.
- Resumo curto acima do botao quando necessario, como total estimado ou itens restantes.
```

## M05 - Mobile Grocery List Card

```text
Crie o componente `M05 Mobile Grocery List Card`.

Uso:
Card compacto de lista de compras.

Conteudo:
- Nome da lista.
- Estado.
- Quantidade de itens.
- Cidade/contexto.
- Ultima otimizacao.
- Acao principal.
```

## M06 - Mobile List Item Editor Row

```text
Crie o componente `M06 Mobile List Item Editor Row`.

Uso:
Linha editavel de item dentro da lista.

Conteudo:
- Produto.
- Variante ou "qualquer variante".
- Quantidade.
- Controles de editar/remover.
- Indicador quando a variante foi definida pela otimizacao.
```

## M07 - Mobile Optimization Decision Card

```text
Crie o componente `M07 Mobile Optimization Decision Card`.

Uso:
Decisao por item apos otimizar.

Conteudo:
- Produto e variante escolhida.
- Loja.
- Preco.
- Economia contra segundo menor preco elegivel.
- Media da variante na cidade em linha separada.
- Trust factor resumido.
- Origem/frescor.

Texto quando sem nota:
"Ainda sem nota fiscal aceita apoiando este preco".
```

## M08 - Mobile Checklist Item

```text
Crie o componente `M08 Mobile Checklist Item`.

Uso:
Checklist dentro do mercado.

Conteudo:
- Checkbox grande.
- Produto e variante.
- Preco esperado.
- Loja.
- Acao rapida para preco incorreto.
- Estado comprado/reportado/indisponivel.
```

## M09 - Mobile Price Mismatch Sheet

```text
Crie o componente `M09 Mobile Price Mismatch Sheet`.

Uso:
Bottom sheet para reportar preco errado.

Conteudo:
- Produto.
- Preco esperado.
- Campo preco encontrado.
- Opcao item indisponivel.
- Acao confirmar.
- Mensagem curta de que a nota fiscal pode validar depois.
```

## M10 - Mobile Receipt Scan Entry

```text
Crie o componente `M10 Mobile Receipt Scan Entry`.

Uso:
Entrada para envio de nota fiscal.

Conteudo:
- Acao principal: escanear QR code.
- Fallback: colar URL NFC-e.
- Estado de permissao da camera.
- Nota de privacidade simples.
```

## M11 - Mobile Reward Status Card

```text
Crie o componente `M11 Mobile Reward Status Card`.

Uso:
Status de reward de nota fiscal.

Estados:
- nota recebida
- aguardando liberacao manual
- processamento
- reward pendente
- reward validado
- sem reward
- rejeitada

Conteudo:
- Pontos quando validado.
- Proxima etapa.
- Motivo quando sem reward/rejeitada.
```

