# Desenvolvimento local

## Visao geral

O projeto esta dividido em tres superficies principais:

- `backend/` para a API NestJS
- `mobile/` para o aplicativo Flutter
- `web/` para a aplicacao React/Vite

Os artefatos de infraestrutura ficam em `infra/terraform/`.

## Servicos locais

A base atual assume estes servicos durante o desenvolvimento local:

- PostgreSQL em `127.0.0.1:5432`
- Redis em `127.0.0.1:6379`

Esses valores padrao estao documentados em:

- [backend/.env.example](../backend/.env.example)
- [web/.env.example](../web/.env.example)

## Configuracao do backend

1. Copie `backend/.env.example` para `backend/.env`.
2. Instale as dependencias em `backend/`.
3. Inicie a aplicacao NestJS.

Valores padrao atuais:

- porta da API: `3000`
- banco PostgreSQL: `pricely`
- porta do Redis: `6379`
- segredo JWT: valor local definido em `backend/.env.example`

## Configuracao com Docker Compose

O repositorio inclui [docker-compose.yml](../docker-compose.yml) para desenvolvimento
local. A stack sobe:

- `postgres` em `localhost:5433`
- `redis` em `localhost:6380`
- `backend` em `localhost:3000`
- `web` em `localhost:5173`

Para iniciar:

```bash
docker compose up --build
```

Para parar:

```bash
docker compose down
```

Para resetar PostgreSQL e Redis:

```bash
docker compose down -v
```

Observacoes:

- O container do backend executa `prisma generate`, `prisma db push --force-reset` e
  `prisma db seed` antes de iniciar a API em modo de desenvolvimento.
- A stack de compose e orientada a desenvolvimento local, com volumes montados e banco
  descartavel quando necessario.
- A URL de API usada pelo navegador e `http://localhost:3000`.
- Validacao local de referencia em `2026-04-27`:
  - `docker compose up --build -d`
  - backend com `build`, `lint` e testes verdes
  - web com `build`, `lint` e testes verdes
  - mobile com `analyze`, `test` e `build apk --debug` verdes
  - smoke validado para auth, cidades/ofertas publicas, listas, otimizacao e metricas admin

## Configuracao do web

1. Copie `web/.env.example` para `web/.env`.
2. Instale as dependencias em `web/`.
3. Inicie o servidor Vite.

Valores padrao atuais:

- servidor web local: `5173`
- URL base da API: `http://localhost:3000`
- base de autenticacao: `/auth`
- base de cidades publicas: `/regions`

## Configuracao do mobile

1. Garanta Flutter stable com Dart 3 instalado.
2. Instale as dependencias em `mobile/`.
3. Rode o app em emulador ou dispositivo.

Os valores padrao do mobile ficam centralizados em
[api_environment.dart](../mobile/lib/core/networking/api_environment.dart):

- URL base da API: `http://10.0.2.2:3000`
- base de autenticacao: `/auth`
- base de cidades publicas: `/regions`

Exemplo de override para dispositivo fisico ou host alternativo:

```bash
flutter run --dart-define=PRICELY_API_BASE_URL=http://192.168.0.10:3000
```

## Notas

- Os valores de ambiente devem continuar local-first, salvo quando uma task pedir algo
  hospedado explicitamente.
- Novas variaveis devem ser refletidas nos respectivos `.env.example`.
- O Prisma e a fonte de verdade para schema relacional e fluxo de banco em
  `backend/prisma/`.
