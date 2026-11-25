# AGENTS.md

Guide for coding agents working in this repository. Product decisions and the local run story live in `README.md`. Coding standards live in `.cursor/rules/`. This file is the map, the commands, and the invariants.

## Overview

Local e-commerce catalog with CSV import, search, and a simulated purchase. There are no user accounts and no real payment provider.

- API: FastAPI, Poetry, Python 3.12, SQLAlchemy 2 async (`asyncpg`), Alembic sync (`psycopg2`), PostgreSQL 16.
- Storefront: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS.
- Locales: `en` (default) and `es`. Catalog names stay as stored. UI chrome is bilingual.

## Setup

Docker is the supported environment. Postgres is published on host port **5433** so it does not collide with another local database. The API is on **8000**. The storefront is on **3000**.

```bash
make up
make unit-test-api
make unit-test-ui
make down
```

`make up` is `docker compose up --build`. `make down` removes the database volume.

Compose services: `db`, `migration` (`alembic upgrade head`), `server` (uvicorn with reload), `ui` (Next dev). `server` mounts `backend/src` and `backend/test`. `ui` mounts `frontend` and keeps an anonymous `/code/node_modules` volume. `WATCHPACK_POLLING=true`.

Server Components call `API_URL` (`http://server:8000`). The browser calls `NEXT_PUBLIC_API_URL` (`http://localhost:8000`).

Database credentials live in `.env.backend`. Do not copy them into docs, commits, or logs. `POSTGRES_URL` is rewritten in `backend/src/config.py`: Alembic uses `postgresql+psycopg2://`, the app uses `postgresql+asyncpg://`. Keep those driver prefixes. A bare `postgresql://` URL picks the wrong driver.

Storefront: http://localhost:3000/en/products and http://localhost:3000/es/products. API docs: http://localhost:8000/docs. Health: `GET /healthcheck/` returns `{"status":"ok"}`.

## Layout

```text
backend/src/domain/                      pure catalog, CSV, and purchase rules
backend/src/use_cases/                   one function per use case; Pydantic request objects
backend/src/infrastructure/persistency/  session.py plus products, orders, categories
backend/src/infrastructure/payments/     Charge callable and fake_charge
backend/src/routes/                      HTTP adapters
backend/src/database/entities/           SQLAlchemy models
backend/src/database/alembic/            sync migrations
backend/test/                            pytest; example CSV is in test/fixtures/
frontend/app/[locale]/                   routes; [locale]/layout.tsx is the root layout
frontend/components/                     client UI
frontend/dictionaries/                   en.ts and es.ts
frontend/lib/                            API, Zod, cart, i18n, cache
frontend/public/media/                   category WebP placeholders
data/                                    same example CSV, downloaded 2026-11-21
```

## Backend

Use functions. Persistence is module functions that receive an `AsyncSession`, flush, and do not commit. `get_session()` yields the session, commits after the request, rolls back on any exception, and closes. Stock, order lines, and the payment reference belong to that one transaction.

Routes take HTTP primitives and build a Pydantic request for the use case. Create and update share `ProductWriteRequest`. `PlaceOrderRequest` sends product id and quantity. The server owns price and stock and locks product rows with `with_for_update`.

`Charge` is `Callable[[Decimal], Awaitable[str]]`. `fake_charge` always approves and returns `pay_{uuid4 hex}`. Inject it with `Depends(get_payment_gateway)`.

`classify_csv` stays a sync function. `import_products` calls it with `asyncio.to_thread`. The import route reads at most `MAX_CSV_BYTES` (1_000_000) plus one byte, rejects a larger file, and decodes `utf-8-sig`.

Domain rules:

- SKU is the business identity, stored uppercased. The last valid row for a SKU wins. A later invalid row does not erase an earlier valid one.
- Blank rows are skipped. Invalid rows are reported. Valid rows are still saved.
- A new category name is created. Name and description are required after trim and stored literally, including `<script>` and SQL text.
- Price is a decimal `>= 0`. A leading `$` is accepted. `free` is rejected. `0.00` is valid.
- Stock is an int `>= 0`. Empty or negative stock is rejected. `0` is valid and not purchasable.
- Weight is a decimal `>= 0`. Empty weight is rejected. `0` is valid.
- A product that already appears on an order cannot be deleted (409).
- Search matches name, SKU, and description, with an optional category filter. List query: `q`, `category`, `page`, `pageSize` (1–100).

Money is `NUMERIC(12, 2)` and weight is `NUMERIC(12, 3)`. JSON serializes both as strings. Response fields use camelCase through `BaseSchema` (`weightKg`, `pageSize`, `productId`, `unitPrice`, `lineTotal`, `paymentReference`).

Expected errors are `DomainError`, a subclass of `HTTPException`. The response body is `{message, details?}`. Validation is 422 `{message, details:[{field, message}]}`. Unhandled errors are 500 `{message}` with a uuid and a server-side stack. The frontend `readApiError` reads `message` and `details`. Do not return FastAPI's default `{detail: ...}`.

Queries go through SQLAlchemy parameters. Do not interpolate catalog text into SQL or HTML.

New migration, with the stack already up:

```bash
docker compose exec server alembic revision --autogenerate -m "short name"
```

Re-apply with `docker compose run --rm migration`.

## Frontend

Routes live under `app/[locale]`. `params` and `searchParams` are Promises. `/` and any path without a locale redirect to `/${locale}/...`. The locale is the `NEXT_LOCALE` cookie when it is `en` or `es`, otherwise `en`. Do not use `Accept-Language`.

Keep catalog, search, and product detail as Server Components. Admin, cart, checkout, and orders are `noindex`. `app/robots.ts` allows `/en/products` and `/es/products` and disallows both locales of `/admin`, `/cart`, `/checkout`, and `/orders`. Product pages set `alternates.languages` and schema.org `Product` JSON-LD. Escape `<` as `\u003c` inside that JSON-LD script. Render product and category names as text.

There are no product photos. Cards use the category WebP in `frontend/public/media/` through `next/image`. Brand is "norte". Do not introduce another brand mark.

Public catalog reads use the `catalog` cache tag for 60 seconds (`frontend/lib/api.ts`). Admin and order reads use `live` (`cache: "no-store"`). After a successful create, edit, delete, CSV import, or payment, call `revalidateCatalog` so both locales drop that tag.

The cart is Zustand persist, key `ecommerce-cart`, `skipHydration: true`. Rehydrate before showing the count. Clear the cart only after the order status is paid. Checkout displays a preview total and posts product id plus quantity.

React Query is for mutations. Zod in `frontend/lib/schemas.ts` checks forms, checkout, search params, and route ids before the request. A route id that is not a positive integer is a 404. API messages are English. Spanish UI passes them through `translateApiMessage`.

Dictionaries are `frontend/dictionaries/en.ts` and `es.ts`. Add a key to both. `Dictionary` is widened from the Spanish dictionary, so the two files must stay in lockstep.

## Testing

Run tests in Docker. Host `node` is not the supported toolchain.

- `make unit-test-api` runs pytest in the API image. It does not need a running Postgres. Handler tests monkeypatch the persistency modules and use a fake session.
- `make unit-test-ui` runs Jest and React Testing Library in the Next image.

The example CSV has 97 data rows: 86 accepted unique SKUs, 6 rejected, 2 skipped blank lines, 3 superseded. The only duplicated SKUs are `RS-001` (2) and `BS-021` (3). The last `RS-001` is price `94.99` and stock `120`. The last `BS-021` is `59.99`. `XS-001` and `SQL-001` stay verbatim.

When a change is visible in the storefront, exercise the affected flow in the browser on desktop and, for layout changes, on a narrow viewport. A single screenshot is not enough. Check the other locale and the pages that share the changed state.

## Style

Python: type every signature, `async def` for I/O, `def` for pure functions, early returns, snake_case modules, line length 119 (Black and isort). Pydantic models and SQLAlchemy entities stay classes. Do not add handler classes, repository classes, or a unit-of-work class.

TypeScript: functional components, lowercase-dash directories, Server Components by default, `'use client'` only where the browser is required. Tailwind tokens already in the config: `ink`, `muted`, `line`, `fog`, `rausch` (`#ff385c`).

Do not add comments to application source. Leave generated files alone (`frontend/next-env.d.ts`, Alembic's `script.py.mako`).

## Boundaries

- Do not commit `.env.backend`, `.venv`, `node_modules`, or `.next`.
- Do not add a real payment provider, user accounts, or an event bus.
- Do not translate product or category names.
- Do not start the open work below unless the task asks for it.
- Commit only when the user asks.

## Open work

API:

- Request-logging middleware. CORS is the only middleware.
- An API read cache in memory or Redis for categories and product search, invalidated by product writes and CSV import. This is separate from the 60-second Next.js catalog cache, which already exists.

Storefront:

- Load checkout and the admin forms with `next/dynamic`.
- Replace `window.confirm` on delete with a Radix or shadcn dialog.
- Guard `/admin` in middleware. Those pages are reachable without a session.
