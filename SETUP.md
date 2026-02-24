# Complete Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  React App                    Envoy Proxy                  │
│  (localhost:3000)             (localhost:8081)             │
│                                                             │
│  ┌─────────────┐             ┌──────────────┐             │
│  │   Browser   │──gRPC-Web──→│    Docker    │──gRPC──┐    │
│  │   Client    │←────────────│  Container   │←───────┘    │
│  └─────────────┘  HTTP/1.1   └──────────────┘  HTTP/2     │
│                                      │                      │
└──────────────────────────────────────┼──────────────────────┘
                                       │
                                       ↓
                              Your gRPC Server
                              (localhost:50051)
```

## Components

### 1. Your gRPC Server (Go)
- **Port**: 50051
- **Protocol**: Native gRPC (HTTP/2)
- **Your responsibility**: Already running

### 2. Envoy Proxy (Docker)
- **Port**: 8081 (gRPC-Web), 9901 (Admin)
- **Protocol**: Translates gRPC-Web ↔ gRPC
- **Purpose**: Browsers can't speak native gRPC
- **Configuration**: envoy.yaml

### 3. React Client (Vite)
- **Port**: 3000
- **Protocol**: gRPC-Web (HTTP/1.1)
- **Connects to**: Envoy on port 8081

## Why Do We Need Envoy?

Browsers can only use:
- ✅ HTTP/1.1 or HTTP/2 via fetch/XHR
- ❌ Cannot use native gRPC (requires HTTP/2 trailers, binary framing)

**Solution**: Envoy proxy translates:
- **Frontend → Envoy**: gRPC-Web (browser-compatible)
- **Envoy → Backend**: Native gRPC (efficient binary protocol)

## Setup Steps

### Step 1: Start Your gRPC Server
```bash
# Make sure your Go server is running on port 50051
go run main.go
```

### Step 2: Start Envoy Proxy

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Using Docker Run**
```bash
docker run -d \
  --name grpc-envoy-proxy \
  -p 8081:8081 \
  -p 9901:9901 \
  -v "${PWD}/envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  --add-host host.docker.internal:host-gateway \
  envoyproxy/envoy:v1.22-latest
```

**Verify Envoy is running:**
```bash
# Check container
docker ps | findstr envoy

# Check admin interface
curl http://localhost:9901/stats
# Or visit in browser: http://localhost:9901
```

### Step 3: Start React App
```bash
npm run dev
```

Visit: **http://localhost:3000**

## Troubleshooting

### Check if all services are running:
```bash
# gRPC Server
netstat -an | findstr 50051

# Envoy Proxy
docker ps
curl http://localhost:8081

# React App
# Should auto-open at http://localhost:3000
```

### Envoy Logs
```bash
docker logs grpc-envoy-proxy
```

### Stop Envoy
```bash
docker-compose down
# OR
docker stop grpc-envoy-proxy
docker rm grpc-envoy-proxy
```

### Restart Envoy (after config changes)
```bash
docker-compose restart
# OR
docker restart grpc-envoy-proxy
```

## File Structure

```
test-user-notification/
├── docker-compose.yaml    # Envoy container definition
├── envoy.yaml            # Envoy proxy configuration
├── vite.config.js        # Vite bundler config
├── index.html            # Entry HTML
├── package.json          # Dependencies
└── src/
    ├── index.jsx         # React entry point
    ├── App.jsx           # Main component (connects to gRPC)
    └── proto/
        ├── notification_pb.js           # Message definitions
        └── notification_grpc_web_pb.js  # gRPC client
```

## Ports Summary

| Service       | Port | Protocol   | Purpose                |
|---------------|------|------------|------------------------|
| React App     | 3000 | HTTP       | UI development server  |
| Envoy Proxy   | 8081 | gRPC-Web   | Browser-to-gRPC bridge |
| Envoy Admin   | 9901 | HTTP       | Monitoring/debugging   |
| gRPC Server   | 50051| gRPC       | Your notification server|

## Key Points

1. **Envoy is required** - React can't talk directly to your gRPC server
2. **Envoy runs in Docker** - Independent service, not part of your app
3. **Your gRPC server stays unchanged** - It doesn't know about Envoy
4. **All three must be running** - Server → Envoy → React client

## Quick Start Commands

```bash
# Terminal 1: Start your gRPC server
go run main.go

# Terminal 2: Start Envoy
docker-compose up

# Terminal 3: Start React app
npm run dev
```

That's it! 🚀
