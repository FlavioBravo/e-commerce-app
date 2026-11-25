# E-commerce

Catalog, CSV import, simulated purchase, and a Next.js storefront.

Example CSV downloaded on 2026-11-21. A copy used by the tests is in `backend/test/fixtures/Code_Challenge_E-Commerce.csv`. The same file is also at `data/Code_Challenge_E-Commerce.csv`.

## Run locally

Docker is the supported setup. Postgres is published on port 5433 so it does not collide with another local database. The API listens on port 8000 and the storefront on port 3000.

```bash
make up
make unit-test-api
make unit-test-ui
```

Storefront: [http://localhost:3000/en/products](http://localhost:3000/en/products) (English, the default) and [http://localhost:3000/es/products](http://localhost:3000/es/products) (Spanish). `/` opens in English, then keeps a saved choice.

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

`make down` stops the containers and deletes the database volume.

## Decisions

Each use case is a function. Persistence is a set of module functions, and FastAPI injects `get_session()`. That session commits once, after the use case finishes. Stock, order lines, and the simulated payment reference are saved in that same transaction. A failure rolls the whole request back.

Money is `NUMERIC(12, 2)`. Weight is `NUMERIC(12, 3)`. JSON returns them as strings so a client does not parse currency through binary floating point. Product responses use camelCase field names.

The import route accepts a UTF-8 CSV of at most 1 MB. `classify_csv` runs in a worker thread through `asyncio.to_thread`, and the database writes stay on the request session. The SKU is the business identity. Import treats a repeated SKU as an update, and the last valid row in the file wins. An invalid later row does not erase a valid earlier one. Blank rows are skipped. Invalid rows are reported and the valid rows are still saved. Categories are created when a valid product names a new one. Price `0.00`, stock `0`, and weight `0` are valid. `free`, a negative stock, a missing weight, a missing category, and a blank name are rejected. A leading `$` is accepted on prices in the CSV.

`$29.99`, `<script>`, and `Robert'); DROP TABLE products;--` are data. Queries go through SQLAlchemy parameters. The stored name is the original text.

A product that already appears on an order cannot be deleted. Purchase sends product id and quantity. The server reads the current price and stock, locks those product rows, and refuses the order when any line asks for more stock than there is. The payment gateway is a port that always approves and returns a `pay_...` reference.

Search matches name, SKU, and description, with an optional category filter, and the list is paginated.

The storefront is Next.js. English is the default language, at `/en`, and Spanish is at `/es`. Product and category names stay as stored in the catalog. Catalog, search, and product pages are rendered on the server, so the HTML already contains the product name, price, and description. A product page adds a title, a meta description, and schema.org `Product` JSON-LD. The API has no photo per product, so each category uses an 800×800 WebP served through `next/image`, with the intrinsic size and lazy loading. Admin, cart, checkout, and order pages send `noindex`. While a locale page loads, the header stays and the content is a skeleton. If that page fails while rendering, the same layout shows an error screen with a retry.

The cart lives in Zustand and `localStorage`, and it rehydrates in the browser before the count is shown. Create, edit, delete, CSV import, and checkout use React Query. Product forms, checkout, search params, and route ids are checked with Zod before the request leaves the browser. Those checks follow the API catalog rules: SKU shape, required text lengths, a non-negative price with at most two decimals, a non-negative weight with at most three decimals, and an integer stock. A route id that is not a positive integer is a 404. Checkout sends product id and quantity; the displayed cart total is only a preview.

Public catalog reads stay cached for 60 seconds under one cache tag. Admin and order reads skip that cache and hit the API on every request. A successful create, edit, delete, CSV import, or payment drops the tag and revalidates the catalog and product pages in both languages. Server Components call the API at `http://server:8000`. The browser calls `http://localhost:8000`.

`make unit-test-api` runs the pytest suite in the API container. `make unit-test-ui` runs the storefront suite with Jest and React Testing Library in the Next.js container. The storefront tests cover the catalog, cart, header, product form, checkout, CSV import, delete, and catalog revalidation.

## Alternatives

PostgreSQL keeps the purchase atomic. A document database would split stock and the order across checks that are harder to roll back together.

Saving each write as soon as it happens would store a product before the order exists. The session commits once, at the end of the request.

Rejecting the whole CSV because a few rows are dirty would throw away a usable catalog. The import returns created, updated, rejected, skipped, and superseded rows.

## Included

Product CRUD, category list, CSV import, search, purchase, and the storefront. Docker runs Postgres, migrations, the API, and Next.js.

## Improvements

Request logging and an API read cache are still open. The only middleware is CORS. Public catalog pages already keep their own 60-second Next.js cache, described above. A later change can log method, path, status, and duration for every request, and keep the category list and product search in memory or Redis until a product write or a CSV import changes them.

The storefront still has three open improvements:

- Load checkout and the admin forms with `next/dynamic`, so those client bundles stay out of the first catalog visit.
- Use Radix, or shadcn on top of it, for dialogs. Deleting a product still calls `window.confirm`.
- Guard `/admin` in middleware. Those pages are reachable without a session.
