# test-notification

Local dummy dashboard to exercise Anora. React + Vite + gRPC-Web. Flow: **login (phone+OTP) → auto-connect over gRPC → live notification/heartbeat log → availability toggle**. No auto-connect before login.

## Run

```bash
# 1) start Anora locally (from anora/Anora)
docker compose -f docker-compose.test.yaml up -d --build

# 2) start the dashboard
npm install
npm run dev            # http://localhost:3000
```

Open `http://localhost:3000`, log in with a real registered phone number (OTP), watch the log panel.

## How it talks to Anora

All traffic goes through the Vite dev server on port 3000 (only port that needs forwarding):

| Browser calls | Vite proxies to | Used for |
|---------------|-----------------|----------|
| `/grpc/*` | `VITE_GRPC_PROXY_TARGET` (Envoy `:16969`) | gRPC-Web: AddConnection, StreamNotifications, RemoveConnection |
| `/anora/*` | `VITE_ANORA_PROXY_TARGET` (HTTP gateway `:16767`) | `/set_availability` |

Login (`registerWithoutPasswordV4` / `verifyOTPV4`) hits `VITE_GRAPHQL_URL` directly.

## Env (`.env`, gitignored)

| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_GRPC_URL` | `/grpc` | gRPC-Web endpoint (same-origin, proxied) |
| `VITE_GRPC_PROXY_TARGET` | `http://localhost:16969` | where `/grpc` forwards (Envoy) |
| `VITE_ANORA_HTTP_BASE` | `/anora` | base for HTTP gateway calls |
| `VITE_ANORA_PROXY_TARGET` | `http://localhost:16767` | where `/anora` forwards (gateway) |
| `VITE_ANORA_API_KEY` | `d0n0tr3d33m` | `X-API-KEY` for `/set_availability` (visible in browser) |
| `VITE_GRAPHQL_URL` | `https://db.vocallabs.ai/v1/graphql` | phone+OTP login |

## Identity

- `connection_id` (gRPC) = `auth.user.id` (Hasura user id)
- `service_name` (gRPC) = `device_uuid` — UUID persisted in `localStorage`
- gRPC metadata = `authorization: Bearer <auth_token>` on every call
- Server returns `unique_id = <user.id>_<device_uuid>`; the stream subscribes with that.

## Functionality

- **Login** (`src/Login.jsx`, `src/auth/auth.js`): phone → OTP (CAP.js captcha). On success stores `{ authToken, refreshToken, user.id }`.
- **Connect** (`src/notifications/useNotification.js`): on login, `AddConnection` then `StreamNotifications`; logs every request/response/error and incoming notification + heartbeat.
- **Availability toggle** (`src/api/availability.js`): `POST /anora/set_availability?client_id=&device_id=&ready=` with `X-API-KEY`. Logs request/response.
- **Logout**: `RemoveConnection` + clears session, returns to login.

## Key files

```
src/App.jsx                      login gate + dashboard (status, toggle, log panel)
src/Login.jsx                    phone/OTP form
src/auth/auth.js                 OTP login, device id, session
src/notifications/useNotification.js  gRPC connect/stream + logging
src/api/availability.js          /set_availability call
src/config.js                    env config
vite.config.js                   /grpc + /anora dev proxies
```
