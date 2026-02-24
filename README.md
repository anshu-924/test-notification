# Notification Client - React gRPC-Web App

A simple React application that connects to a gRPC notification service and displays received notifications and heartbeats.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Protocol Buffers compiler (`protoc`)
- `protoc-gen-grpc-web` plugin
- Docker (for Envoy proxy)
- Your gRPC server running on localhost:50051

## Installation

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Install Protocol Buffers Compiler

**Windows:**
- Download from: https://github.com/protocolbuffers/protobuf/releases
- Extract and add to PATH

**macOS:**
```bash
brew install protobuf
```

**Linux:**
```bash
sudo apt-get install protobuf-compiler
```

### 3. Install gRPC-Web Protoc Plugin

Download the plugin from: https://github.com/grpc/grpc-web/releases

**Windows:**
```bash
# Download protoc-gen-grpc-web-1.4.2-windows-x86_64.exe
# Rename to protoc-gen-grpc-web.exe and add to PATH
```

**macOS:**
```bash
brew install grpc-web
```

**Linux:**
```bash
# Download the binary and make it executable
sudo mv protoc-gen-grpc-web-1.4.2-linux-x86_64 /usr/local/bin/protoc-gen-grpc-web
sudo chmod +x /usr/local/bin/protoc-gen-grpc-web
```

### 4. Generate gRPC-Web Client Code

```bash
npm run generate-proto
```

This will create:
- `src/proto/notification_pb.js` - Message definitions
- `src/proto/notification_grpc_web_pb.js` - Service client

## Running the Application

### 1. Start Envoy Proxy (gRPC-Web requires HTTP/1.1 to gRPC bridge)

```bash
docker run -d -v "$(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  --network="host" envoyproxy/envoy:v1.22-latest
```

**Windows PowerShell:**
```powershell
docker run -d -v "${PWD}/envoy.yaml:/etc/envoy/envoy.yaml:ro" --network="host" envoyproxy/envoy:v1.22-latest
```

### 2. Make sure your gRPC server is running on localhost:50051

### 3. Start the React app

```bash
npm start
```

The app will open at `http://localhost:3000`

## What the App Does

When the app starts, it automatically:

1. **Connects to the gRPC server** via Envoy proxy (localhost:8080)
2. **Calls AddConnection** with:
   ```json
   {
     "connection_id": "client_457",
     "service_name": "web_browser1"
   }
   ```
3. **Starts streaming notifications** using the returned unique connection ID (e.g., `client_457_web_browser1`)
4. **Logs all received messages**:
   - Notifications
   - Heartbeats
   - Connection status
   - Errors

## UI Features

- **"Hello" heading** as requested
- **Connection status indicator** (green for connected, red for errors)
- **Live notification logs** with timestamps and color-coded message types:
  - 🔵 Blue: Heartbeats
  - 🟢 Green: Notifications
  - 🔴 Red: Errors
  - 🟠 Orange: Requests
  - 🟣 Purple: Responses

## Architecture

```
React App (localhost:3000)
    ↓ gRPC-Web (HTTP/1.1)
Envoy Proxy (localhost:8080)
    ↓ gRPC (HTTP/2)
Your gRPC Server (localhost:50051)
```

## Troubleshooting

### "Cannot connect to server"
- Ensure your gRPC server is running on port 50051
- Check that Envoy proxy is running: `docker ps`
- Verify Envoy logs: `docker logs <container-id>`

### "Module not found: proto files"
- Run `npm run generate-proto` to generate the client code

### CORS errors
- Envoy configuration includes CORS headers, but verify your server allows gRPC-Web

## Sending Test Notifications

From your gRPC server or another client, send notifications to `client_457_web_browser1` and they will appear in the browser console and UI.

## Development

- Edit `src/App.js` to modify the UI or connection logic
- Edit `notification.proto` and re-run `npm run generate-proto` if you change the protocol
- Logs appear both in the UI and browser console
