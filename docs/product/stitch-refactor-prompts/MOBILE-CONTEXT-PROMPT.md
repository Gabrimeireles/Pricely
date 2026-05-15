# Mobile Stitch Context Prompt

Use este prompt como contexto base para qualquer tela mobile do Pricely.

```text
Voce esta criando UMA tela mobile para o Pricely.

Crie somente a tela citada no prompt especifico.
Nao crie componentes globais extras.
Nao crie bottom navigation, header, scanner, modal, drawer ou componentes compartilhados se eu nao pedir explicitamente.
Quando eu informar nomes de componentes ja aprovados, reutilize esses componentes e nao redesenhe variacoes novas.
Nao crie fluxo inteiro automaticamente.
Nao misture web/admin neste projeto.

Produto:
Pricely e uma plataforma brasileira de otimizacao de compras de mercado. No mobile, o foco e shopper: continuar compra, otimizar lista, usar checklist dentro do mercado, escanear/enviar nota fiscal e acompanhar rewards. O app compartilha conta com a web. Rewards so sao concedidos depois que a nota fiscal e processada e considerada util/confiavel. Billing esta desativado por enquanto.

Direcao UX mobile:
- Mobile e tarefa-primeiro.
- Uma acao primaria por tela.
- Bottom sticky CTA quando fizer sentido.
- Bottom navigation so se eu pedir explicitamente.
- Conteudo deve caber em viewport real de telefone, aproximadamente 390px de largura.
- Sem desktop encolhido.
- Sem tabelas desktop.
- Sem overflow horizontal.
- Touch targets minimos de 44px.
- Texto precisa caber nos containers.
- Acoes principais nao podem depender de hover.

Visual:
- Primario: teal/emerald.
- Sucesso: lime/green.
- Pendente/alerta: amber.
- Critico/erro: coral/red.
- Base: off-white, white cards, pale green-gray surfaces, texto escuro.
- Radius: 8px.
- Use produto/imagem quando ajudar reconhecimento.
- Modo claro e modo escuro devem estar previstos por tokens.
- Nao use orbs, blobs, bokeh ou decoracao abstrata.

Localizacao:
- So prometa proximidade/distancia quando houver coordenadas precisas salvas.
- CEP fallback e cidade selecionada mantem contexto, mas nao prometem proximidade.
- Raio local padrao: 5 km.
- Estados mobile importantes: city-only, coordenadas precisas, CEP fallback, permissao negada/restrita, geolocalizacao indisponivel.

Checklist:
- Deve funcionar dentro do mercado.
- Checkboxes grandes.
- Reportar preco errado deve ser rapido.
- Concluir lista quando todos os itens forem marcados.
- Total pago e opcional.
- Depois de concluir, incentivar envio da nota fiscal.

Receipt/QR:
- Scanner QR deve ser primeira opcao quando a tela for de nota.
- URL NFC-e colada deve ser fallback.
- Estados: nota recebida, aguardando liberacao manual, processamento, reward pendente, reward validado, sem reward, rejeitada.
- Nao prometa reward antes da validacao de qualidade.
```

## Mobile Screen Names

Use estes nomes no Stitch, um por tela:

1. `Mobile Home and Next Action`
2. `Mobile City and Location Setup`
3. `Mobile Lists`
4. `Mobile List Editor`
5. `Mobile Optimization Mode Picker`
6. `Mobile Optimization Result`
7. `Mobile Shopping Checklist`
8. `Mobile Price Mismatch Report`
9. `Mobile Receipt QR Scanner`
10. `Mobile Receipt Submission Status`
11. `Mobile Rewards`
12. `Mobile Profile and Premium State`
