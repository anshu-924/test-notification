import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Target for the anora HTTP gateway (port 16767). The browser calls '/anora/*'
  // (same-origin, so no CORS) and Vite forwards it here, stripping the prefix.
  const anoraTarget = env.VITE_ANORA_PROXY_TARGET || 'http://localhost:16767'

  // Target for envoy's gRPC-Web proxy (port 16969). The browser sends gRPC-Web
  // calls to '/grpc/*' (same-origin, port 3000) and Vite forwards them here,
  // stripping the prefix. This keeps ALL traffic on port 3000, so only that one
  // port needs to be reachable/forwarded (e.g. over a Remote-SSH tunnel) — the
  // browser never has to reach envoy on 16969 directly.
  const grpcTarget = env.VITE_GRPC_PROXY_TARGET || 'http://localhost:16969'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/anora': {
          target: anoraTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anora/, ''),
        },
        '/grpc': {
          target: grpcTarget,
          changeOrigin: true,
          // gRPC-Web server-streaming must not be buffered by the proxy.
          ws: true,
          rewrite: (path) => path.replace(/^\/grpc/, ''),
        },
      },
    },
    optimizeDeps: {
      include: ['google-protobuf', 'grpc-web'],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/, /proto/],
      },
    },
  }
})
