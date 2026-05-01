## Resumo
- corrige a regressao em que itens de lista com `catalogProductId` terminavam a otimizacao com `coverageStatus: none`
- faz o worker carregar ofertas por `catalogProductId` e manter fallback por nome normalizado
- adiciona cobertura de regressao unit e integration para o fluxo catalog-backed

## Issue
Closes #150

## Validacao
- `cd backend && npm test -- --runInBand test/unit/jobs/optimization-run.processor.spec.ts`
- `cd backend && npm test -- --runInBand test/integration/optimization/multi-market-optimization.integration.spec.ts`
- `cd backend && npm test -- --runInBand`
- `cd backend && npm run lint`
- `cd backend && npm run build`
- `docker compose up --build -d`
- smoke HTTP com lista catalog-backed retornando `coverageStatus: complete` e `totalEstimatedCost: 22.9`