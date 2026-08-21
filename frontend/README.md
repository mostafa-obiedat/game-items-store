# Frontend

React + TypeScript client for the store, built with Vite and styled with Tailwind CSS.

## Setup

Requires Node 20+ and a running backend.

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs on http://localhost:5173. `npm run build` produces a static bundle in `dist/`.

## Environment variables

| Variable       | Default                     | Notes                                     |
| -------------- | --------------------------- | ----------------------------------------- |
| `VITE_API_URL` | `http://localhost:8000/api` | Read at build time, not at runtime         |

Because Vite inlines this value into the bundle, the Docker image takes it as a build argument.

## Pages

| Route                   | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `/login`                | Signs in and stores the token                                       |
| `/products`             | Product grid with pagination and a location filter                  |
| `/products/:id`         | Product details and the buy button                                  |
| `/receipt/:reference`   | Receipt for a completed order                                       |

Everything except `/login` sits behind a route guard that redirects anonymous visitors to the login
page, remembering where they were headed.

## How it is put together

`src/context/AuthContext.tsx` holds the token and exposes `login` / `logout`. `src/api/client.ts` is
an axios instance that attaches the token to every request and, on a `401`, clears it and sends the
user back to the login page — so an expired session never leaves a page half-loaded.

The listing page keeps `page` and `location` in the URL query string. That makes the current view
shareable and reloadable, and it means the browser back button steps through pagination the way a
user expects.

The receipt page prefers the order it was handed during navigation and only calls the API when it
was opened directly, for example after a refresh.

Layouts are mobile-first: the catalog is a single column on phones and widens to four columns on
large screens, and both breakpoints are exercised by the pages above.
