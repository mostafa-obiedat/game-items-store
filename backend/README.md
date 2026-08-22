# Backend

Django REST Framework API for the store: JWT authentication, a paginated product catalog and an
order/receipt flow. Data lives in PostgreSQL.

## Setup

Requires Python 3.11+ and a reachable PostgreSQL instance.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # adjust the database settings if needed
python manage.py migrate
python manage.py import_products
python manage.py seed_demo_user
python manage.py runserver
```

The API is then on http://localhost:8000/api and the interactive docs on
http://localhost:8000/api/docs/.

If you do not have Postgres installed locally, one container is enough:

```bash
docker run -d --name game-items-db -e POSTGRES_DB=game_items \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

## Environment variables

| Variable               | Default                | Notes                                     |
| ---------------------- | ---------------------- | ----------------------------------------- |
| `SECRET_KEY`           | dev placeholder        | Must be set to a real secret in production |
| `DEBUG`                | `True`                 |                                           |
| `ALLOWED_HOSTS`        | `localhost,127.0.0.1`  | Comma separated                           |
| `POSTGRES_DB`          | `game_items`           |                                           |
| `POSTGRES_USER`        | `postgres`             |                                           |
| `POSTGRES_PASSWORD`    | `postgres`             |                                           |
| `POSTGRES_HOST`        | `localhost`            |                                           |
| `POSTGRES_PORT`        | `5432`                 |                                           |
| `CORS_ALLOWED_ORIGINS` | dev client origins     | Comma separated                           |
| `DEMO_USERNAME`        | `demo`                 | Used by `seed_demo_user`                  |
| `DEMO_PASSWORD`        | `demo1234`             | Used by `seed_demo_user`                  |

## Management commands

`import_products [path]` reads a CSV (default `data/items.csv`) and loads it into the database.
Rows are matched on the CSV `id`, so running it again updates existing products rather than
duplicating them. Rows with an unparseable price or an unknown location are reported and skipped,
and the whole file is imported in one transaction.

`seed_demo_user` creates (or resets the password of) the account used to sign in.

## Endpoints

Everything except login, refresh and the docs requires an `Authorization: Bearer <access token>`
header.

| Method | Path                        | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/auth/login/`          | Exchange credentials for an access token |
| POST   | `/api/auth/refresh/`        | Get a new access token from the cookie   |
| POST   | `/api/auth/logout/`         | Clear the refresh cookie                 |
| GET    | `/api/products/`            | Paginated product list                   |
| GET    | `/api/products/{id}/`       | Single product                           |
| POST   | `/api/orders/`              | Buy one product, returns the receipt     |
| GET    | `/api/orders/{reference}/`  | Fetch a receipt by its UUID              |

Access tokens last 60 minutes, refresh tokens one day.

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo1234"}'
```

```json
{ "refresh": "...", "access": "..." }
```

Wrong credentials return `401`.

### Products

`GET /api/products/` accepts `page` (default 1), `page_size` (default 12, max 100), `location`
(`JO` or `SA`) and `search` (matches the title).

```bash
curl "http://localhost:8000/api/products/?location=JO&page=2" \
  -H "Authorization: Bearer $ACCESS"
```

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/products/?location=JO&page=3",
  "previous": "http://localhost:8000/api/products/?location=JO",
  "results": [
    {
      "id": 13,
      "title": "Potion of Healing",
      "description": "Restores health completely over 5 seconds",
      "price": "22.00",
      "location": "JO",
      "location_display": "Jordan"
    }
  ]
}
```

An unknown location returns `400`; an unknown product id returns `404`.

Prices are serialized as decimal strings on purpose, so they do not lose precision passing through
JSON floats. The client formats them for display.

### Buying

```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 4}'
```

```json
{
  "reference": "1ed913de-718f-4284-b741-167a8b485dd2",
  "product": {
    "id": 4,
    "title": "Mystic Wand",
    "description": "Casts powerful spells to defeat foes",
    "price": "200.00",
    "location": "SA",
    "location_display": "Saudi Arabia"
  },
  "price": "200.00",
  "buyer": "demo",
  "created_at": "2026-08-21T20:46:11.421Z"
}
```

A missing or unknown `product_id` returns `400`. The same payload is returned by
`GET /api/orders/{reference}/`, which only ever returns orders belonging to the caller — anyone
else's reference returns `404`.

## Tests

```bash
python manage.py test
```

The suite covers authentication, that endpoints reject anonymous callers, pagination and its page
size cap, location filtering, the purchase flow including the frozen price, and that one user cannot
read another user's receipt.
