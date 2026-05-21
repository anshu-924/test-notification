# test-notification: login-gated authenticated anora client + availability toggle

**Date:** 2026-05-20
**Status:** Approved (design)

## Problem

The anora notification service was updated to only allow registered accounts. Every gRPC
call now passes through an auth interceptor that requires an `authorization: Bearer <token>`
metadata header, validates it against `https://auth.vocallabs.ai/graphql/hook`, rejects
anonymous users, and enforces that the request's `connection_id` is owned by the
authenticated user.

`test-notification` is currently a no-auth React + Vite gRPC-Web client that auto-connects
with a hardcoded `connection_id` (`client_457`). It can no longer connect. We need to:

1. Add a login page that obtains an auth token using the **same method as `vocallabsui`**
   (phone + OTP).
2. Connect to anora the same way `vocallabsui`'s `NotificationContext` does (Bearer token in
   gRPC metadata; correct identity in `connection_id` / `service_name`).
3. Add an **available / unavailable toggle** that calls anora's HTTP `/set_availability`
   endpoint. (Sending notifications is done manually/externally and is out of scope.)

## Verified facts about the existing systems

### anora gRPC auth (`middleware/grpc_auth_interceptor.go`)
- Unary + stream interceptors require `authorization: Bearer <token>` metadata on every RPC.
- Token validated via GET to `AUTH_URL` (default `https://auth.vocallabs.ai/graphql/hook`),
  which returns `X-Hasura-User-Id`, `X-Hasura-Role`, etc. Anonymous role is rejected.
- Ownership check: `clientID := strings.SplitN(connection_id, "_", 2)[0]` must equal
  `X-Hasura-User-Id`. Enforced on unary calls and on the first stream message.

### anora connection handling (`handlers/notification_handler.go`, `models/models.go`)
- `AddConnection`: `clientID = connection_id` (whole string), `deviceID = service_name`,
  `uniqueID = clientID + "_" + deviceID`. Returns `uniqueID` as the connection_id.
- `StreamNotifications`: looks up by the returned `uniqueID`.
- This is consistent with the vocallabsui convention below: when `connection_id` is a bare
  user-UUID (no `_`), the interceptor's split yields the full UUID and ownership passes, and
  the connection is grouped under `clientID = userId`.

### vocallabsui — the authoritative client convention (`src/services/notifications/NotificationContext.tsx`, `src/hooks/useNotifications.ts`)
- `connect(user.id)` → `ConnectionRequest.setConnectionId(user.id)`,
  `setServiceName(deviceId)` where `deviceId` is a UUID persisted in localStorage key
  `device_uuid`.
- `metadata['authorization'] = 'Bearer ' + auth.authToken` on `addConnection`,
  `streamNotifications`, and `removeConnection`.
- gRPC endpoint: `https://envoy.vocallabs.ai`. The stream subscribes with the **returned**
  connection_id (`userId_deviceId`).

### vocallabsui — login method (`src/services/auth/...`, `app/layout.tsx`)
- CAP.js captcha widget loaded via CDN + inline init script exposing
  `window.capInstance.getToken()` (apiEndpoint `https://cap.subspace.money/1e344b4141/`).
- `sendOTP(phone)`: get CAP token → mutation `registerWithoutPasswordV4(credentials:{phone,
  recaptcha_token})` → sends SMS OTP.
- `verifyOTP(phone, otp)`: mutation `verifyOTPV4(request:{otp, phone, device_data, device_id,
  ip_address, version, lang})` → returns `{ auth_token, refresh_token, id, status }`.
- GraphQL endpoint: `<base>/v1/graphql`. Auth stored in localStorage key `auth` as
  `{ authToken, refreshToken, user: { id }, ... }`.

### anora HTTP gateway (`main.go`)
- Separate port (6767 in docker-compose), **not** behind envoy (envoy proxies only gRPC on
  6969 → 50051).
- `/set_availability` is behind `AuthMiddleware`, which checks an **`X-API-KEY`** header
  (NOT the user's bearer token). No CORS headers are set.
- `POST /set_availability?client_id=X&ready=true|false` (optional `&device_id=Y`).
  - `client_id` only → all devices of the client. `client_id` + `device_id` → that one device.
  - `device_id` is the same value the connection registered with as `service_name`.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Login scope | Phone + OTP only (CAP.js captcha). No passkey/WhatsApp. |
| GraphQL endpoint | Production `https://db.vocallabs.ai/v1/graphql` (configurable). |
| Endpoint config | All endpoints configurable via `VITE_*` env; defaults to local test stack. |
| API key | `d0n0tr3d33m` everywhere. Update anora `docker-compose.test.yaml` to match. |
| Toggle scope | Device-level (sends `device_id`, affects only this dashboard). |
| Toggle CORS | Vite dev proxy only; no CORS change in anora. |

## Identity model (test-notification)

- `connection_id` (gRPC) = `auth.user.id`
- `service_name` (gRPC) = `deviceId` — UUID persisted in localStorage key `device_uuid`,
  generated with `crypto.randomUUID()` (no new dependency; localhost is a secure context).
- gRPC metadata = `{ authorization: 'Bearer ' + auth.authToken }` on every call.
- Toggle = `POST <gateway>/set_availability?client_id=<auth.user.id>&device_id=<deviceId>&ready=<bool>`
  with header `X-API-KEY: <VITE_ANORA_API_KEY>`.

## Architecture / files

### test-notification (all changes here)
1. **`index.html`** — add CAP.js widget `<script src="https://cdn.jsdelivr.net/npm/@cap.js/widget">`
   + inline init script (ported verbatim from vocallabsui `app/layout.tsx`), so
   `window.capInstance.getToken()` is available before the login screen mounts.
2. **`src/config.js`** — read `import.meta.env` with defaults:
   - `VITE_GRPC_URL` → default `http://localhost:6969`
   - `VITE_GRAPHQL_URL` → default `https://db.vocallabs.ai/v1/graphql`
   - `VITE_ANORA_API_KEY` → default `d0n0tr3d33m`
   - `VITE_ANORA_HTTP_BASE` → default `/anora` (proxied in dev)
3. **`src/auth/auth.js`** — `sendOTP(phone)`, `verifyOTP(phone, otp)` via plain `fetch` to the
   GraphQL endpoint; `getDeviceId()`, `saveAuth/getStoredAuth/logout` (localStorage `auth`
   shape `{ authToken, refreshToken, user: { id } }`). Gathers minimal `device_data`/`device_id`
   for the V4 mutation; `ip_address` best-effort (empty allowed), `version`/`lang` sensible
   defaults.
4. **`src/Login.jsx`** — two-step phone → OTP form, inline styles consistent with current App.
   Calls `onLogin(auth)` on success; surfaces errors inline.
5. **`src/api/availability.js`** — `setAvailability(ready)` → POST to
   `${VITE_ANORA_HTTP_BASE}/set_availability` with query params + `X-API-KEY` header.
6. **`src/App.jsx`** — login gate (render `<Login>` if no stored auth). On auth: run the gRPC
   flow with Bearer metadata, `connection_id = user.id`, `service_name = deviceId`; subscribe
   with the returned connection_id. Add an availability toggle (calls `setAvailability`) and a
   logout button (removes connection, clears storage, returns to login).
7. **`vite.config.js`** — add dev-server proxy: `'/anora' → http://localhost:6767`
   (`changeOrigin: true`, rewrite strips `/anora`). Target overridable via an env var
   (e.g. `VITE_ANORA_PROXY_TARGET`) for pointing at a remote gateway in dev.
8. **`.env`** (gitignored) — scaffolds the `VITE_*` keys with the documented defaults.

### anora (single change)
- **`docker-compose.test.yaml`**: `X_API_KEY=testkey` → `X_API_KEY=d0n0tr3d33m` (and update
  the explanatory comment that references `testkey`).

## Out of scope (YAGNI)
- Passkey and WhatsApp login.
- Token auto-refresh on expiry (vocallabsui's refreshing-fetch).
- vocallabsui's reconnect / QUIC-error handling.
- `extra_details` proto field on the client (not needed for auth/toggle; generated proto left
  as-is). Notifications are sent manually/externally.
- CORS on anora's HTTP gateway (handled by the Vite dev proxy locally; production fronting is
  the operator's responsibility).

## Risks / notes
- **API key in the browser.** `d0n0tr3d33m` ships in client-reachable config; anyone using the
  dashboard can read it and toggle any `client_id`'s availability. Acceptable for this internal
  test tool; flagged explicitly.
- **CAP.js dependency.** OTP send fails if the CAP widget script doesn't load. The login should
  surface a clear error in that case.
- **Endpoint realm match.** The login token must be accepted by `auth.vocallabs.ai`. Using the
  production GraphQL endpoint (`db.vocallabs.ai`) is the chosen default; switching realms means
  changing `VITE_GRAPHQL_URL`.
- **Production toggle** will not work from a deployed browser until the operator fronts port
  6767 with a CORS-capable proxy (consequence of the "Vite proxy only" decision).
