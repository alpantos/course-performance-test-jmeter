# Sample App (system under test)

Zero-dependency Node.js app (`node server.js`, Node 18+). **Never deploy this** – static credentials, in-memory data.

```bash
node server.js                          # PORT=3000 by default
SESSION_TTL_SECONDS=30 node server.js   # short idle timeout to test session expiry
LOG_REQUESTS=1 node server.js           # log every request with its cookie/session state
```

## Credentials (static)
`admin / password123`, `user1 / password1`, `user2 / password2`

## Session management
* Cookie `SESSIONID` (HttpOnly, Path=/), random 128-bit id stored server-side in memory.
* Idle timeout 900 s (sliding), configurable via `SESSION_TTL_SECONDS`.
* Session id is regenerated at login; `POST /logout` destroys it server-side and expires the cookie.
* Form login is protected by a CSRF token: `GET /login` creates an anonymous session and embeds a hidden `csrf` field; `POST /login` must send the same token **and** the cookie. (Great for correlation exercises.)

## Endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | no | `{"status":"ok"}` |
| GET | `/login` | no | HTML form with CSRF token, sets anonymous cookie |
| POST | `/login` | no | form: `csrf, username, password` → 302 `/dashboard` (or `/login?error=1`) |
| POST | `/api/login` | no | form or JSON `username, password` → 200 / 401 (no CSRF) |
| POST | `/logout` | – | destroys session, 302 `/login` (POST so link prefetching cannot log you out) |
| GET | `/dashboard` | yes | HTML page; unauthenticated → 302 `/login` |
| GET | `/items` | yes | HTML table with **Edit / Delete** buttons, **Add item** form, `?q=` search, flash message via `?msg=` |
| POST | `/items` | yes | add item: form `csrf, name, price, stock` → 302 `/items?msg=created`; 400 if name/price invalid |
| GET | `/items/{id}/edit` | yes | edit form (404 if missing) |
| POST | `/items/{id}` | yes | save edit: form `csrf, name, price, stock` → 302 `/items?msg=updated` |
| POST | `/items/{id}/delete` | yes | delete: form `csrf` → 302 `/items?msg=deleted` |
| GET | `/api/me` | yes | current user |
| GET/POST | `/api/items` | yes | list (`?q=` filter) / create `{name, price, stock}` → 201 |
| GET/PUT/DELETE | `/api/items/{id}` | yes | read / replace / delete; 404 if missing |

The HTML item forms embed the session's CSRF token in a hidden `csrf` field; a missing/wrong token returns `403`. The row ids are in the markup (`id="item-<n>"`) for regex correlation.

API endpoints return `401` JSON when there is no valid session.

## Look & feel
Alpantos-branded dark theme (navy surfaces, teal accent, logo/favicon) served from `public/` as static files: `/static/app.css`, `/static/logo.svg`, `/favicon.svg` (no authentication needed – handy for "embedded resources" exercises). Markup hooks used by the JMeter plans (`id="item-<n>"`, hidden `csrf` field, flash messages) are unchanged.
