# Quick Start Guide

## Prerequisites Check

Make sure you have:
- ✅ Node.js installed
- ✅ Your gRPC server running on `localhost:50051`
- ⚠️ Envoy proxy (for gRPC-Web bridge)

## Steps to Run

### 1. Start Envoy Proxy

**Using Docker (Recommended):**

```powershell
# For Windows with network mode host (if supported)
docker run -d -v "${PWD}/envoy.yaml:/etc/envoy/envoy.yaml:ro" -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.22-latest

# OR use Docker on Windows without network mode:
docker run -d -v "${PWD}/envoy.yaml:/etc/envoy/envoy.yaml:ro" -p 8080:8080 -p 9901:9901 --add-host host.docker.internal:host-gateway envoyproxy/envoy:v1.22-latest
```

**Verify Envoy is running:**
```powershell
curl http://localhost:9901/stats
# OR in browser: http://localhost:9901
```

### 2. Start the React App

```bash
npm start
```

The app will automatically open at `http://localhost:3000`

## What Happens Next

When the app loads:

1. **Connection is established** to the gRPC server
2. **AddConnection** is called with:
   ```json
   {
     "connection_id": "client_457",
     "service_name": "web_browser1"
   }
   ```
3. **StreamNotifications** starts listening with the returned unique ID: `client_457_web_browser1`
4. **All notifications and heartbeats** will be logged in the UI and browser console

## Test Notifications

From your gRPC server or another client, send notifications to:
- Connection ID: `client_457_web_browser1`
- Client ID: `client_457`

The notifications will appear in real-time on the web page!

## Troubleshooting

### "Cannot connect to gRPC server"
- Check if your gRPC server is running: `netstat -an | findstr 50051`
- Verify Envoy is running: `docker ps`
- Check Envoy configuration points to correct host

### "404 Not Found" or CORS errors
- Make sure Envoy proxy is running on port 8080
- Verify envoy.yaml configuration
- Check browser console for detailed errors

### Hot fix for Windows + Docker Desktop

If `host.docker.internal` doesn't work, update [envoy.yaml](envoy.yaml) line 57:
```yaml
address: 127.0.0.1  # or your actual local IP
```

## Architecture Flow

```
React App (localhost:3000)
      ↓ HTTP/1.1 gRPC-Web
Envoy Proxy (localhost:8080)
      ↓ HTTP/2 gRPC
Your gRPC Server (localhost:50051)
```

## Next Steps

- Open browser console (F12) to see detailed logs
- Send test notifications from your server
- Watch them appear in real-time!

Enjoy! 🚀
