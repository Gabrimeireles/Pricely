# Quickstart: Otimizador de compras

## Objetivo

Validar a stack local replanejada com PostgreSQL, Redis, workers de fila,
autenticacao compartilhada, consultas de catalogo por cidade, listas reutilizaveis,
jobs de otimizacao e CRUD administrativo.

## Pre-requisitos

- Docker Desktop ou Docker Engine para orquestracao local
- Dependencias do backend instaladas para execucao fora do Docker
- Flutter SDK instalado com dispositivo ou emulador disponivel
- Dependencias do web instaladas para execucao fora do Docker
- Dependencias instaladas em `backend/`, `web/` e `mobile/`

## Setup com containers

1. Suba a stack local completa com `docker compose up --build`.
2. Aguarde PostgreSQL, Redis, backend e web ficarem prontos.
3. Confirme acesso aos endpoints:
   - `http://localhost:3000` para a API
   - `http://localhost:5173` para o web
4. Use `docker compose down` para parar a stack.
5. Use `docker compose down -v` quando precisar resetar PostgreSQL e Redis.

## Setup do backend

1. Configure ambiente para PostgreSQL, Redis, segredos JWT/sessao e demais ajustes.
2. Aplique migrations do Prisma ou `db push` e rode o seed minimo com:
   - um admin
   - um customer
   - uma cidade ativa
   - um catalogo pequeno de ofertas
3. Inicie a API NestJS localmente se nao estiver usando Docker.
4. Inicie o worker BullMQ se ele estiver separado da API.
5. Confirme conectividade com PostgreSQL e Redis e exposicao das rotas publicas e admin.

## Setup do mobile

1. Configure o aplicativo Flutter para apontar para o backend local.
2. Entre com uma conta compartilhada.
3. Confirme carregamento de cidades, listas salvas e ultimo resultado de otimizacao.

## Setup do web

1. Configure o web para apontar para o backend local.
2. Inicie a aplicacao web localmente.
3. Confirme que o seletor de cidades mostra cidades visiveis com contagem de
   estabelecimentos ativos.
4. Confirme que o dashboard admin so abre para contas com permissao administrativa.

## Fluxo manual de verificacao

1. Crie uma conta customer e uma conta admin.
2. Entre com a mesma conta customer no mobile e no web.
3. Crie uma lista em uma superficie e confirme que ela aparece na outra.
4. Solicite uma nova otimizacao da lista salva e verifique:
   - o backend responde rapidamente com estado enfileirado
   - um processing job e criado
   - o resultado final pode ser consultado depois
5. Consulte as cidades visiveis e valide:
   - cidades `inactive` nao aparecem publicamente
   - cada cidade visivel retorna quantidade de estabelecimentos ativos
   - uma cidade visivel com `0` estabelecimentos continua aparecendo
6. Navegue por ofertas de uma cidade e abra o detalhe do produto. Valide que o payload
   inclui multiplos precos por estabelecimento quando houver.
7. Entre como admin no web e valide:
   - metricas da visao geral carregam
   - cidades podem ser ativadas e desativadas
   - estabelecimentos podem ser criados ou desativados
   - produtos e ofertas podem ser criados ou editados
8. Force uma falha em um job de otimizacao e valide:
   - a falha aparece nos logs
   - o processing job registra o estado de falha
   - o diagnostico admin consegue expor o problema

## Resultado esperado

- contas compartilhadas funcionam entre mobile e web
- a otimizacao continua sendo responsabilidade do backend e da fila
- a selecao publica de cidades respeita regras de implantacao e contagem ativa
- o detalhe de produto explica de onde veio cada preco
- o CRUD admin controla catalogo e cidades operacionais
- logs e estados de job tornam falhas acionaveis

## Registro de validacao

Validado em `2026-04-27` com a stack local atual:

1. `docker compose down -v`
2. `docker compose up --build -d`
3. `cd backend && npm run lint && npm run build && npm test -- --runInBand`
4. `cd web && npm run lint && npm run build && npm test`
5. `cd mobile && flutter analyze && flutter test && flutter build apk --debug`
6. Smoke executado com sucesso para:
   - `POST /auth/register`
   - `POST /auth/login`
   - `GET /regions`
   - `GET /regions/:slug/offers`
   - `GET /offers/:offerId`
   - `POST /shopping-lists`
   - `POST /shopping-lists/:id/items`
   - `POST /shopping-lists/:id/optimize`
   - `GET /shopping-lists/:id/optimizations/latest`
   - `GET /admin/metrics`
   - `GET /admin/processing-jobs`
   - `GET /admin/queue-health`

## Observacao

O MVP esta funcional, mas ainda exige revisao final de produto e operacao antes de um
sign-off definitivo de release.
