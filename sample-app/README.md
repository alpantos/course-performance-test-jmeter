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
| GET | `/dashboard`, `/items` | yes | HTML pages; unauthenticated → 302 `/login` |
| GET | `/api/me` | yes | current user |
| GET/POST | `/api/items` | yes | list (`?q=` filter) / create `{name, price, stock}` → 201 |
| GET/PUT/DELETE | `/api/items/{id}` | yes | read / replace / delete; 404 if missing |

API endpoints return `401` JSON when there is no valid session.
