# Pricely

Pricely e um app de economia em supermercado com a mesma conta no web e no mobile.
O backend centraliza autenticacao, listas, otimizacao, regioes, ofertas publicas e
dashboard admin.

## Stack atual

- `backend/`: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- `web/`: React + Vite + shadcn/ui
- `mobile/`: Flutter
- `docker-compose.yml`: stack local completa

## Servicos locais

Com Docker:

- backend: `http://localhost:3000`
- web: `http://localhost:5173`
- postgres: `localhost:5433`
- redis: `localhost:6380`

## Subir tudo

```bash
docker compose up --build
```

Resetar banco e Redis:

```bash
docker compose down -v
```

## Contas seed

- admin: `admin@pricely.local` / `admin-password`
- customer: `customer@pricely.local` / `customer-password`

Seed atual inclui:

- cidade `Sao Paulo - SP` com estabelecimento ativo
- cidade `Campinas - SP` em ativacao com `0` estabelecimentos ativos
- produtos demo de arroz e cafe
- oferta publica demo para cafe

## Fluxos ja cobertos

- login e cadastro compartilhados
- listas salvas e reutilizaveis
- otimizacao assíncrona com fila
- ofertas por cidade
- detalhe de oferta
- dashboard admin com metricas e CRUD basico

## Comandos por app

Backend:

```bash
cd backend
npm install
npm run lint
npm run build
npm test -- --runInBand
```

Web:

```bash
cd web
npm install
npm run lint
npm run build
npm test
```

Mobile:

```bash
cd mobile
flutter analyze
flutter test
flutter build apk --debug
```

## Referencias

- [local development](D:/Pricely/docs/local-development.md)
- [quickstart](D:/Pricely/specs/001-grocery-optimizer/quickstart.md)
- [tasks](D:/Pricely/specs/001-grocery-optimizer/tasks.md)
