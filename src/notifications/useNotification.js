// gRPC notification connection, mirroring vocallabsui's NotificationContext
// (connect / disconnect with the bearer token in metadata), trimmed for this
// test dashboard. No connection happens until connect() is called explicitly
// after login.
import { useCallback, useRef, useState } from 'react';
import { NotificationServiceClient } from '../proto/notification_grpc_web_pb';
import { ConnectionRequest, SubscribeRequest } from '../proto/notification_pb';
import { GRPC_URL } from '../config';
import { getDeviceId } from '../auth/auth';

export function useNotification() {
  const [status, setStatus] = useState('disconnected'); // disconnected|connecting|connected|error
  const [logs, setLogs] = useState([]);

  const clientRef = useRef(null);
  const streamRef = useRef(null);
  const connectionIdRef = useRef(null);
  const clientIdRef = useRef(null);
  const authTokenRef = useRef(null);
  const isConnectingRef = useRef(false);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  }, []);

  // Connect using the user's id (connection_id) and a bearer token.
  const connect = useCallback(
    (clientId, authToken) => {
      if (isConnectingRef.current || connectionIdRef.current) {
        return; // already connecting/connected
      }
      isConnectingRef.current = true;
      clientIdRef.current = clientId;
      authTokenRef.current = authToken;
      setStatus('connecting');

      const metadata = authToken ? { authorization: `Bearer ${authToken}` } : {};
      const deviceId = getDeviceId();

      if (!clientRef.current) {
        clientRef.current = new NotificationServiceClient(GRPC_URL, null, null);
      }
      const client = clientRef.current;

      const req = new ConnectionRequest();
      req.setConnectionId(clientId); // connection_id = Hasura user id
      req.setServiceName(deviceId); // service_name = device id

      addLog(`Connecting to ${GRPC_URL} as ${clientId}...`, 'info');
      addLog(
        `AddConnection request: { connection_id: "${clientId}", service_name: "${deviceId}" }`,
        'request'
      );

      client.addConnection(req, metadata, (err, response) => {
        isConnectingRef.current = false;
        if (err) {
          addLog(`AddConnection error: ${err.message}`, 'error');
          setStatus('error');
          return;
        }
        addLog(
          `AddConnection response: { success: ${response.getSuccess()}, message: "${response.getMessage()}", connection_id: "${response.getConnectionId()}" }`,
          'response'
        );
        if (!response.getSuccess()) {
          setStatus('error');
          return;
        }

        const uniqueId = response.getConnectionId();
        connectionIdRef.current = uniqueId;
        setStatus('connected');

        addLog(`Starting notification stream for connection_id: "${uniqueId}"`, 'info');
        const sub = new SubscribeRequest();
        sub.setConnectionId(uniqueId);

        const stream = client.streamNotifications(sub, metadata);
        streamRef.current = stream;

        stream.on('data', (notification) => {
          const notifType = notification.getType();
          const logType = notifType === 'heartbeat' ? 'heartbeat' : 'notification';
          const notifData = {
            id: notification.getId(),
            connection_id: notification.getConnectionId(),
            created_at: notification.getCreatedAt(),
            updated_at: notification.getUpdatedAt(),
            client_id: notification.getClientId(),
            call_id: notification.getCallId(),
            service_name: notification.getServiceName(),
            timestamp: notification.getTimestamp(),
            type: notifType,
          };
          addLog(`${notifType.toUpperCase()} received: ${JSON.stringify(notifData, null, 2)}`, logType);
        });

        stream.on('status', (s) => {
          addLog(`Stream status: ${s.code} - ${s.details}`, 'info');
        });

        stream.on('error', (streamErr) => {
          addLog(`Stream error: ${streamErr.message}`, 'error');
          setStatus('error');
        });

        stream.on('end', () => {
          addLog('Stream ended', 'info');
          setStatus('disconnected');
        });
      });
    },
    [addLog]
  );

  const disconnect = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.cancel();
      } catch (_e) {
        /* ignore */
      }
      streamRef.current = null;
    }

    if (clientRef.current && clientIdRef.current) {
      const metadata = authTokenRef.current
        ? { authorization: `Bearer ${authTokenRef.current}` }
        : {};
      const removeReq = new ConnectionRequest();
      removeReq.setConnectionId(clientIdRef.current);
      removeReq.setServiceName(getDeviceId());
      addLog(
        `RemoveConnection request: { connection_id: "${clientIdRef.current}", service_name: "${getDeviceId()}" }`,
        'request'
      );
      clientRef.current.removeConnection(removeReq, metadata, (err, response) => {
        if (err) {
          addLog(`RemoveConnection error: ${err.message}`, 'error');
        } else {
          addLog(
            `RemoveConnection response: { success: ${response.getSuccess()}, message: "${response.getMessage()}" }`,
            'response'
          );
        }
      });
    }

    connectionIdRef.current = null;
    clientIdRef.current = null;
    isConnectingRef.current = false;
    setStatus('disconnected');
  }, [addLog]);

  return { status, logs, connect, disconnect, addLog };
}
