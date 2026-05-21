// Runtime configuration, read from Vite env (VITE_*) with sensible defaults.
// Defaults target the LOCAL anora test stack (docker-compose.test.yaml).
// Override any of these in `.env` (gitignored).
const env = import.meta.env;

// gRPC-Web endpoint (envoy). Default '/grpc' is same-origin and handled by the
// Vite dev-server proxy (see vite.config.js) → http://localhost:16969, so the
// browser only ever talks to port 3000 (works through a Remote-SSH tunnel that
// forwards just 3000). For a deployed setup, point this at envoy directly,
// e.g. https://envoy.vocallabs.ai.
export const GRPC_URL = env.VITE_GRPC_URL || '/grpc';

// GraphQL endpoint used for phone+OTP login. Must issue tokens accepted by
// the notification service's validator (auth.vocallabs.ai).
export const GRAPHQL_URL =
  env.VITE_GRAPHQL_URL || 'https://db.vocallabs.ai/v1/graphql';

// X-API-KEY for anora's HTTP gateway (/set_availability). NOTE: shipped to the
// browser and therefore visible to anyone using this dashboard.
export const ANORA_API_KEY = env.VITE_ANORA_API_KEY || 'd0n0tr3d33m';

// Base path/URL for anora's HTTP gateway. Default '/anora' is handled by the
// Vite dev-server proxy (see vite.config.js) → http://localhost:16767, which
// avoids CORS in local dev. For a deployed setup, point this at a CORS-capable
// URL that fronts the gateway.
export const ANORA_HTTP_BASE = env.VITE_ANORA_HTTP_BASE || '/anora';
