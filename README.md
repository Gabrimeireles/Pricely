# Pricely

Pricely e um aplicativo para economia em supermercado com conta compartilhada entre
web e mobile. O backend centraliza autenticacao, listas, otimizacao, cidades,
ofertas publicas e dashboard administrativo.

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

Para resetar banco e Redis:

```bash
docker compose down -v
```

## Contas seed

- admin: `admin@pricely.local` / `admin-password`
- customer: `customer@pricely.local` / `customer-password`

O seed atual inclui:

- cidade `Sao Paulo - SP` com estabelecimento ativo
- cidade `Campinas - SP` em ativacao com `0` estabelecimentos ativos
- produtos de demonstracao para arroz e cafe
- oferta publica de demonstracao para cafe

## Fluxos ja cobertos

- login e cadastro compartilhados
- listas salvas e reutilizaveis
- otimizacao assincrona com fila
- ofertas por cidade
- detalhe de oferta
- dashboard admin com metricas e CRUD basico

## Comandos por aplicacao

### Backend

```bash
cd backend
npm install
npm run lint
npm run build
npm test -- --runInBand
```

### Web

```bash
cd web
npm install
npm run lint
npm run build
npm test
```

### Mobile

```bash
cd mobile
flutter analyze
flutter test
flutter build apk --debug
```

## Referencias

- [Desenvolvimento local](docs/local-development.md)
- [Quickstart](specs/001-grocery-optimizer/quickstart.md)
- [Tasks](specs/001-grocery-optimizer/tasks.md)
