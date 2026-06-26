# Stitch Prompt Add-on: Generation Rules

Add this block to every Stitch generation prompt.

```text
Crie somente a tela citada neste prompt.

Nao crie telas extras.
Nao crie o fluxo inteiro automaticamente.
Nao misture web/admin desktop com mobile.
Se componentes aprovados forem informados, reutilize esses componentes pelo nome e nao redesenhe versoes novas.
Se o pedido for de componente, crie somente o componente citado e nao crie tela completa.

Se esta tela for web/admin desktop:
- use canvas desktop;
- deixe responsivo pronto para implementacao em desktop, tablet e mobile;
- mostre como header, filtros, tabelas, cards e action bars se adaptam;
- tabelas devem virar linhas/cards no mobile;
- nao use largura fixa que quebre em telas menores.

Se esta tela for mobile:
- use viewport real de telefone, aproximadamente 390px de largura;
- respeite a altura e largura da tela;
- sem overflow horizontal;
- use bottom navigation ou bottom sticky CTA quando fizer sentido;
- nao gere desktop encolhido.

Para todas as telas:
- inclua modo claro e modo escuro como diretriz visual;
- use tokens para light/dark, nao cores invertidas manualmente;
- textos nao podem estourar containers;
- botoes e controles precisam ter pelo menos 44px em mobile;
- nenhuma acao principal deve depender de hover;
- mantenha WCAG AA.
```
