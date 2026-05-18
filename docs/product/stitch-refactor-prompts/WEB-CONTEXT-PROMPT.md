# Web/Admin Stitch Context Prompt

Use este prompt como contexto base para qualquer tela web/admin do Pricely.

```text
Voce esta criando UMA tela web/admin desktop para o Pricely.

Crie somente a tela citada no prompt especifico.
Nao crie componentes globais extras.
Nao crie header, menu, sidebar, modal, drawer ou componentes compartilhados se eu nao pedir explicitamente.
Quando eu informar nomes de componentes ja aprovados, reutilize esses componentes e nao redesenhe variacoes novas.
Nao crie fluxo inteiro automaticamente.
Nao misture mobile neste projeto.

Produto:
Pricely e uma plataforma brasileira de otimizacao de compras de mercado. O usuario escolhe cidade, opcionalmente salva localizacao precisa ou CEP fallback, cria listas reutilizaveis, otimiza por cidade ou raio local, confere decisoes por item, compra com checklist, reporta preco errado e envia nota fiscal. Rewards so sao concedidos depois que a nota fiscal e processada e considerada util/confiavel. Billing esta desativado; premium e creditos sao operacoes de suporte/admin.

Direcao UX:
- A tela deve parecer workspace operacional, nao landing page.
- Priorize tarefa atual, proxima acao e evidencias.
- Use layout compacto, denso mas respiravel.
- Use linguagem PT-BR clara.
- Nao use hero marketing.
- Nao use orbs, blobs, bokeh ou decoracao abstrata.
- Nao mostre IDs tecnicos como informacao primaria.
- Use icon actions para acoes repetidas.
- Use cards apenas para objetos repetidos, modais ou ferramentas enquadradas.
- Nao use cards dentro de cards.

Visual:
- Primario: teal/emerald.
- Sucesso: lime/green.
- Pendente/alerta: amber.
- Critico/erro: coral/red.
- Base: off-white, white cards, pale green-gray surfaces, texto escuro.
- Radius: 8px.
- Numeros e precos com visual tabular.
- Modo claro e modo escuro devem estar previstos por tokens.

Responsivo:
- Use canvas desktop.
- O design precisa estar pronto para implementacao responsiva em desktop, tablet e mobile.
- Tabelas devem ter comportamento planejado para virar cards/linhas empilhadas no mobile.
- Nao use largura fixa que cause overflow.
- Textos precisam caber nos containers.
- Acoes principais nao podem depender de hover.

Localizacao:
- So prometa proximidade/distancia quando houver coordenadas precisas salvas.
- CEP fallback e cidade selecionada mantem contexto, mas nao prometem proximidade.
- Raio local padrao: 5 km.

Modos de otimizacao:
- Uma loja perto de mim: exige coordenadas precisas.
- Menor preco perto de mim: exige coordenadas precisas.
- Menor total na cidade: usa cidade, nao promete proximidade.

Confianca/evidencia:
- Mostre trust factor, origem, contagem de notas fiscais aceitas, frescor e explicacao quando relevante.
- Se nao houver nota fiscal, use: "Ainda sem nota fiscal aceita apoiando este preco".
- Nao use: "0 notas fiscais confiaveis".
```

## Web/Admin Screen Names

Use estes nomes no Stitch, um por tela:

1. `Web Public Shell - City Location Radius Context`
2. `Web Public Home Workspace`
3. `Web Lists Workspace`
4. `Web List Editor`
5. `Web Optimization Mode Workspace`
6. `Web Optimization Result`
7. `Web Shopping Checklist`
8. `Web Receipt Submission and Rewards`
9. `Web Offers Explorer`
10. `Web Offer Detail`
11. `Web Supported Cities`
12. `Admin Shell and Operations Overview`
13. `Admin Users`
14. `Admin Receipt Queue`
15. `Admin Receipt Processing Detail`
16. `Admin Catalog Products and Variants`
17. `Admin Offers`
18. `Admin Establishments and Regions`
19. `Admin Lists and Optimization Evidence`
