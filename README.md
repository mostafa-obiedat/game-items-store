# Game Items Store

A small store for digital game items. The catalog is loaded from a CSV file, users sign in with a
token, browse a paginated product grid, open a product, buy it, and get a receipt.

The project is one repository with two independent modules:

- `backend/` — Django REST API (JWT auth, catalog, orders)
- `frontend/` — React + TypeScript client built with Vite

They share nothing but the HTTP API, so either one can be run, deployed or replaced on its own.

```
browser ──> frontend (React, nginx :3000)
               │  JSON + Bearer token
               v
            backend (Django REST, gunicorn :8000)
               │
               v
            postgres :5432
```

## Running everything with Docker

Requires Docker Desktop. From the project root:

```bash
docker compose up --build
```

That starts Postgres, runs the migrations, imports `backend/data/items.csv`, creates the demo
account, and serves both applications:

| What        | URL                          |
| ----------- | ---------------------------- |
| Web client  | http://localhost:3000        |
| API         | http://localhost:8000/api    |
| API docs    | http://localhost:8000/api/docs/ |

Sign in with:

```
username: demo
password: demo1234
```

To start over from an empty database, run `docker compose down -v`.

## Running the modules directly

Each module has its own README with the details:

- [backend/README.md](backend/README.md) — environment variables, CSV import, endpoint reference, tests
- [frontend/README.md](frontend/README.md) — environment variables, dev server, pages

## Design decisions

**PostgreSQL.** Prices are money, so they are stored as `DECIMAL` rather than a float, and Postgres
handles fixed-point numbers exactly. It also handles concurrent writes properly, which matters once
orders are being created, and it is the database Django is most commonly run against in production.
SQLite would have been enough for 100 rows, but it would not have been representative of anything
past the demo.

**One row per CSV line.** The CSV repeats the same titles with slightly different prices
(`Sword of Valor` appears at 150, 155, 152 …). Those are treated as separate products keyed on the
CSV `id` rather than deduplicated by title, because nothing in the data says they are the same item,
and the import stays reversible that way. The import is idempotent: re-running it updates existing
rows instead of creating duplicates.

**Orders store the price they were bought at.** An order copies the product price at purchase time
instead of pointing at the live product price. A receipt has to keep showing what was actually paid,
even after the catalog price changes. Products are also protected from deletion while orders
reference them.

**Orders are addressed by a short random reference.** A receipt URL looks like `/receipt/Y425PUE2`
rather than carrying a sequential id, so orders cannot be found by counting and the reference does
not leak how many orders exist. It is drawn from an alphabet with no look-alike characters, so it is
short enough to print on the receipt and read out over the phone. The API additionally scopes order
lookups to the signed-in user, so someone else's reference returns a 404 either way.

**Products are addressed by a slug**, so a URL reads `/products/mystic-wand` instead of
`/products/4`. The catalog repeats titles, so the importer numbers the duplicates
(`sword-of-valor`, `sword-of-valor-2`, …) to keep slugs unique and stable across re-imports.

**Authentication is deny-by-default.** DRF is configured with `IsAuthenticated` globally, so a new
endpoint is private unless it explicitly opts out. Only login, refresh and the docs are public.

**No token is readable by JavaScript.** The refresh token is set as an `httpOnly` cookie, so a script
running on the page cannot read it; the short-lived access token is held in a module variable in
memory and never reaches `localStorage`. When a request comes back `401`, the client quietly trades
the cookie for a new access token and replays the request, so a long session never interrupts the
user, and a page reload restores the session from the cookie alone.

The usual alternative is to keep both tokens in `localStorage`. That is simpler, but any XSS on the
page can read them and, worse, walk off with a refresh token that stays valid for a day. Moving it
into a cookie does not make XSS harmless — an attacker can still ride the session while the page is
open, since the browser attaches the cookie automatically — but it does stop the token being
exfiltrated and reused elsewhere later. The cost of that choice is CSRF exposure, which is why the
cookie is `SameSite=Lax` (browsers do not attach it to cross-site POSTs), scoped to `/api/auth/` so
it is not sent with ordinary API calls, and marked `Secure` whenever `DEBUG` is off.

**Pagination defaults to 12 items** per page, which fills the product grid evenly at every breakpoint.
Clients can ask for a different `page_size`, capped at 100 so a caller cannot request the whole table.

## Assumptions

- Buying does not involve payment processing. "Buy" means an order record is created and a receipt is
  returned, which is what the flow calls for.
- One product per purchase request, so no cart or quantity handling.
- A single seeded demo account is enough; there is no registration flow.
- Prices are treated as a single currency and displayed as USD.
