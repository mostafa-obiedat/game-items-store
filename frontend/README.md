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

`src/context/AuthContext.tsx` exposes `login` / `logout` and the current user. `src/api/client.ts`
keeps the access token in a module variable — deliberately not in `localStorage` — and attaches it to
every request. The refresh token never reaches the client at all: it is an `httpOnly` cookie, which
is why the axios instance is created with `withCredentials`.

When a request comes back `401`, the client posts to `/auth/refresh/`, gets a new access token from
the cookie and replays the request once, so an hour-old tab keeps working instead of dropping the
user on the login page mid-task. Requests that fail while a refresh is already in flight wait on that
same refresh rather than each starting their own. If the refresh itself fails, the user is sent to
`/login`.

Because the access token only lives in memory, it is gone after a reload. On mount the provider tries
one silent refresh to rebuild the session from the cookie, and route guards wait for that check
(`ready`) before deciding anything — otherwise a reload would bounce a signed-in user to the login
page. Signing out calls the API, since only the server can clear an `httpOnly` cookie.

The listing page keeps `page` and `location` in the URL query string. That makes the current view
shareable and reloadable, and it means the browser back button steps through pagination the way a
user expects.

The receipt page prefers the order it was handed during navigation and only calls the API when it
was opened directly, for example after a refresh.

Layouts are mobile-first: the catalog is a single column on phones and widens to four columns on
large screens, and both breakpoints are exercised by the pages above.
