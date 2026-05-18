# Web/Admin Component Prompts

Use estes prompts no projeto web/admin desktop antes de criar telas.

Regra para todos os componentes:

```text
Crie somente o componente citado. Nao crie tela completa, fluxo completo, telas extras ou variantes nao solicitadas.
Use o contexto de `WEB-CONTEXT-PROMPT.md`, `00-system-summary.md` e `00-design-system.md`.
O componente precisa estar pronto para modo claro e modo escuro por tokens.
O componente precisa ser responsivo: desktop completo, tablet compacto e mobile empilhado quando fizer sentido.
Nao use cards dentro de cards. Nao use hero marketing. Nao use decoracao abstrata.
```

## C01 - Web Public Header

```text
Crie o componente `C01 Web Public Header`.

Uso:
Header para fluxos publicos/logged-in de shopper.

Conteudo:
- Pricely icon como marca visual principal.
- Navegacao primaria: Ofertas, Cidades, Minhas listas, Notas fiscais.
- Area de conta: entrar/perfil.
- Estado ativo de navegacao.
- Versao compacta para mobile/tablet.

Nao incluir:
- Conteudo de pagina.
- Strip de localizacao.
- Sidebar admin.
```

## C02 - Web City Location Radius Strip

```text
Crie o componente `C02 Web City Location Radius Strip`.

Uso:
Faixa persistente abaixo do header para cidade, precisao de localizacao e raio.

Estados obrigatorios:
- city-only: "Sao Paulo - cobertura por cidade"
- precise coordinates: "Distancia ativa - raio 5 km"
- CEP fallback: "CEP salvo - sem promessa de proximidade"
- permission denied: "Permissao negada - use CEP ou cidade"
- unsupported geolocation: "Geolocalizacao indisponivel"

Conteudo:
- Cidade atual.
- Estado de precisao.
- Raio local padrao 5 km quando houver coordenadas precisas.
- Nota curta: somente coordenadas precisas habilitam otimizacao local por distancia.
- Acoes: usar localizacao, salvar CEP, trocar cidade.

Regra:
CEP e cidade-only nunca podem prometer proximidade.
```

## C03 - Web Next Action Lane

```text
Crie o componente `C03 Web Next Action Lane`.

Uso:
Linha compacta de proximas acoes no workspace.

Conteudo:
- Estado atual do fluxo.
- Proxima acao recomendada.
- Acao secundaria opcional.
- Status visual sem depender apenas de cor.
- Espaco para alertas pequenos, como "billing desativado" ou "nota aguardando liberacao".
```

## C04 - Web Grocery List Card

```text
Crie o componente `C04 Web Grocery List Card`.

Uso:
Card repetido para listas de compras.

Conteudo:
- Nome da lista.
- Cidade/contexto.
- Quantidade de itens.
- Ultima otimizacao.
- Estado: rascunho, otimizada, em compra, concluida.
- Acoes com icones: abrir, otimizar, duplicar, mais opcoes.

Responsivo:
No mobile vira linha/card compacto sem overflow.
```

## C05 - Web Product Search Row

```text
Crie o componente `C05 Web Product Search Row`.

Uso:
Linha de busca/adicao de produto em lista.

Conteudo:
- Campo de busca.
- Resultado com produto canonico.
- Variante selecionada ou "qualquer variante".
- Quantidade.
- Unidade.
- Acao adicionar.
- Indicador de imagem de variante quando disponivel.
```

## C06 - Web Optimization Mode Card

```text
Crie o componente `C06 Web Optimization Mode Card`.

Uso:
Escolha de modo de otimizacao.

Modos:
- Uma loja perto de mim: exige coordenadas precisas.
- Menor preco perto de mim: exige coordenadas precisas.
- Menor total na cidade: usa cidade, sem promessa de proximidade.

Conteudo:
- Nome do modo.
- Quando usar.
- Requisitos.
- Estado habilitado/desabilitado.
- Motivo quando desabilitado.
```

## C07 - Web Optimization Evidence Module

```text
Crie o componente `C07 Web Optimization Evidence Module`.

Uso:
Evidencia de decisao por item.

Conteudo:
- Produto canonico.
- Variante escolhida pela otimizacao.
- Marcador quando a variante foi escolhida pela otimizacao e pode trocar em otimizacoes futuras.
- Loja selecionada.
- Preco.
- Economia contra segundo menor preco elegivel.
- Media da variante na cidade como informacao separada.
- Trust factor com origem, notas fiscais aceitas, frescor e administracao/manual quando aplicavel.

Texto obrigatorio quando sem evidencia de nota:
"Ainda sem nota fiscal aceita apoiando este preco".
```

## C08 - Web Price Comparison Module

```text
Crie o componente `C08 Web Price Comparison Module`.

Uso:
Comparar uma variante em varios estabelecimentos.

Conteudo:
- Melhor preco destacado.
- Lista compacta de outros estabelecimentos.
- Distancia quando houver coordenadas precisas.
- Cidade/bairro quando nao houver coordenadas.
- Tendencia: subiu, caiu, estavel.
- Origem da evidencia.
```

## C09 - Web Shopping Checklist Item

```text
Crie o componente `C09 Web Shopping Checklist Item`.

Uso:
Item marcavel durante compra.

Conteudo:
- Checkbox grande.
- Produto e variante especifica.
- Loja e preco esperado.
- Botao/report de preco incorreto.
- Status: pendente, comprado, reportado, indisponivel.
- Campo rapido para preco encontrado quando reportar.
```

## C10 - Web Receipt Status Timeline

```text
Crie o componente `C10 Web Receipt Status Timeline`.

Uso:
Acompanhar nota fiscal enviada e reward.

Estados:
- recebida
- aguardando liberacao manual
- processamento
- reward pendente
- reward validado
- sem reward
- rejeitada

Conteudo:
- Linha do tempo compacta.
- Proxima etapa.
- Motivo quando rejeitada ou sem reward.
```

## C11 - Admin Sidebar Shell

```text
Crie o componente `C11 Admin Sidebar Shell`.

Uso:
Shell administrativo com sidebar.

Navegacao:
- Visao geral
- Usuarios
- Notas fiscais
- Processamentos
- Catalogo
- Ofertas
- Estabelecimentos
- Regioes
- Listas e otimizacoes
- Saude

Conteudo:
- Pricely icon.
- Usuario admin.
- Estado ativo.
- Area principal vazia para pagina.
- Responsivo com drawer/compact nav em tablet/mobile.
```

## C12 - Admin Data Table Pattern

```text
Crie o componente `C12 Admin Data Table Pattern`.

Uso:
Tabela administrativa reutilizavel.

Conteudo:
- Busca.
- Filtros de status.
- Colunas com labels humanos antes de IDs tecnicos.
- Status badges.
- Acoes por linha com icones.
- Botao "abrir detalhes" com icone, nao texto "Go to link".

Responsivo:
No mobile/tablet virar lista de linhas/cards administrativas.
```

## C13 - Admin Receipt Review Line Item

```text
Crie o componente `C13 Admin Receipt Review Line Item`.

Uso:
Linha de item extraido de nota fiscal no detalhe de processamento.

Conteudo:
- Texto original extraido.
- Produto/variante pareado.
- Confianca do matcher.
- Acao para criar produto/variante quando nao existir.
- Preco antigo vs novo.
- Indicador subiu/caiu.
- Estado de validacao.
```
