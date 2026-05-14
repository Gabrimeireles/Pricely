# Pricely Stitch Refactor Prompts

Projeto Stitch novo: `Pricely MVP UX Refactor - Web Admin Mobile 2026`

Project ID: `6992023142009606802`

Use estes arquivos como prompts independentes no Stitch. O fluxo recomendado:

1. Criar/aplicar o design system com `DESIGN.md` ou `00-design-system.md`.
2. Criar primeiro as telas web públicas na ordem `01` a `09`.
3. Criar as telas admin na ordem `10` a `14`.
4. Criar as telas mobile na ordem `15` a `18`.
5. Depois de revisar o visual, selecionar as telas aprovadas e só então implementar no repositório.

Regra de escopo: o protótipo novo substitui as telas antigas como direção visual. Não tentar preservar layout antigo se ele conflitar com o fluxo atual do MVP.

## Como usar o DESIGN.md

Opção recomendada:

1. Abra `DESIGN.md`.
2. Cole o conteúdo no Stitch como base para criar o design system do projeto.
3. Depois, para cada tela, cole:
   - `00-system-summary.md`
   - `DESIGN.md`
   - o prompt específico da tela, por exemplo `03-lists-workspace.md`

Se o Stitch pedir apenas um prompt curto, use `DESIGN.md` para o design system e depois use cada arquivo numerado como prompt de tela.
