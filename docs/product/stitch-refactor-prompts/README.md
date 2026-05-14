# Pricely Stitch Refactor Prompts

Projetos Stitch novos:

- Web/admin desktop: `Pricely MVP UX Refactor - Web Admin Desktop 2026`
  - Project ID: `8872616086150863294`
- Mobile: `Pricely MVP UX Refactor - Mobile 2026`
  - Project ID: `1457528815500978003`

Projeto misto descartado para uso final:

- `Pricely MVP UX Refactor - Web Admin Mobile 2026`
- Project ID: `6992023142009606802`
- Motivo: o Stitch trabalha melhor quando web/admin desktop e mobile ficam em projetos separados.

Use estes arquivos como prompts independentes no Stitch. O fluxo recomendado:

1. Criar/aplicar o design system com `DESIGN.md` ou `00-design-system.md`.
2. No projeto web/admin desktop `8872616086150863294`, criar primeiro as telas web públicas na ordem `01` a `09`.
3. No mesmo projeto web/admin desktop, criar as telas admin na ordem `10` a `14`.
4. No projeto mobile `1457528815500978003`, criar as telas mobile na ordem `15` a `18`.
5. Depois de revisar o visual, selecionar as telas aprovadas e só então implementar no repositório.

Regra de escopo: o protótipo novo substitui as telas antigas como direção visual. Não tentar preservar layout antigo se ele conflitar com o fluxo atual do MVP.

## Diretriz obrigatória em todo prompt

Ao colar qualquer prompt no Stitch, inclua esta instrução junto:

```text
Crie somente a tela citada neste prompt. Nao crie telas extras, nao crie fluxo inteiro automaticamente e nao misture web com mobile.

Se o prompt for web/admin desktop: use canvas desktop, respeite layout responsivo pronto para implementacao em desktop, tablet e mobile, e inclua diretrizes de modo claro e escuro.

Se o prompt for mobile: use viewport real de telefone, aproximadamente 390px de largura, sem overflow horizontal, com bottom navigation ou CTA fixo quando fizer sentido, e inclua diretrizes de modo claro e escuro.

Todos os componentes devem caber no viewport, textos nao podem estourar containers, tabelas precisam virar linhas/cards no responsivo, e nenhuma tela deve depender de hover para acao principal.
```

## Como usar o DESIGN.md

Opção recomendada:

1. Abra `DESIGN.md`.
2. Cole o conteúdo no Stitch como base para criar o design system do projeto.
3. Depois, para cada tela web/admin desktop, cole no projeto `8872616086150863294`:
   - `00-system-summary.md`
   - `DESIGN.md`
   - o prompt específico da tela, por exemplo `03-lists-workspace.md`
4. Para cada tela mobile, cole no projeto `1457528815500978003`:
   - `00-system-summary.md`
   - `DESIGN.md`
   - o prompt mobile específico, por exemplo `15-mobile-home-location.md`

Se o Stitch pedir apenas um prompt curto, use `DESIGN.md` para o design system e depois use cada arquivo numerado como prompt de tela.

## Separação por plataforma

Use estes arquivos no projeto web/admin desktop:

- `01-public-shell-location.md`
- `02-public-home-workspace.md`
- `03-lists-workspace.md`
- `04-list-editor.md`
- `05-optimization-workspace.md`
- `06-optimization-result.md`
- `07-checklist-shopping.md`
- `08-receipt-submission-rewards.md`
- `09-offers-explorer-detail-cities.md`
- `10-admin-shell-overview.md`
- `11-admin-users.md`
- `12-admin-receipts-processing.md`
- `13-admin-catalog-offers-establishments.md`
- `14-admin-list-optimization-evidence.md`

Use estes arquivos no projeto mobile:

- `15-mobile-home-location.md`
- `16-mobile-list-checklist.md`
- `17-mobile-optimization-result.md`
- `18-mobile-receipt-qr-rewards.md`
