## Resumo
- promove para `master` a correção de regressao do fluxo catalog-backed de otimizacao
- inclui o ajuste do worker para casar ofertas por `catalogProductId` com fallback por nome normalizado
- inclui os testes de regressao unitarios e de integracao do backend

## Changeset principal
- regressao corrigida em #151

## Validacao base
- `cd backend && npm test -- --runInBand`
- `cd backend && npm run lint`
- `cd backend && npm run build`
- `docker compose up --build -d`
- smoke HTTP com `coverageStatus: complete` e `totalEstimatedCost: 22.9` para item catalog-backed