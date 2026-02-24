import { useEffect, useState, useRef } from 'react';
import { NotificationServiceClient } from './proto/notification_grpc_web_pb';
import { ConnectionRequest, SubscribeRequest } from './proto/notification_pb';

const App = () => {
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const streamRef = useRef(null);
  const clientRef = useRef(null);
  const connectionIdRef = useRef(null);
  const isInitializedRef = useRef(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    // Prevent double initialization
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Create gRPC client
    const client = new NotificationServiceClient('https://envoy.vocallabs.ai', null, null);
    clientRef.current = client;

    const initConnection = async () => {
      try {
        // Step 1: AddConnection
        addLog('Initiating connection to gRPC server...', 'info');
        const connectionRequest = new ConnectionRequest();
        connectionRequest.setConnectionId('client_457');
        connectionRequest.setServiceName('web_browser1');

        addLog('Sending AddConnection request: { connection_id: "client_457", service_name: "web_browser1" }', 'request');

        client.addConnection(connectionRequest, {}, (err, response) => {
          if (err) {
            addLog(`AddConnection error: ${err.message}`, 'error');
            setConnectionStatus('Error');
            return;
          }

          addLog(`AddConnection response: { success: ${response.getSuccess()}, message: "${response.getMessage()}", connection_id: "${response.getConnectionId()}" }`, 'response');

          if (response.getSuccess()) {
            setConnectionStatus('Connected');
            const uniqueId = response.getConnectionId();
            connectionIdRef.current = uniqueId;

            // Step 2: StreamNotifications
            addLog(`Starting notification stream for connection_id: "${uniqueId}"`, 'info');
            const subscribeRequest = new SubscribeRequest();
            subscribeRequest.setConnectionId(uniqueId);

            const stream = client.streamNotifications(subscribeRequest, {});
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
                type: notifType
              };

              addLog(`${notifType.toUpperCase()} received: ${JSON.stringify(notifData, null, 2)}`, logType);
            });

            stream.on('status', (status) => {
              addLog(`Stream status: ${status.code} - ${status.details}`, 'info');
            });

            stream.on('error', (err) => {
              addLog(`Stream error: ${err.message}`, 'error');
              setConnectionStatus('Stream Error');
            });

            stream.on('end', () => {
              addLog('Stream ended', 'info');
              setConnectionStatus('Disconnected');
            });
          }
        });
      } catch (error) {
        addLog(`Connection error: ${error.message}`, 'error');
        setConnectionStatus('Error');
      }
    };

    initConnection();

    // Cleanup function to remove connection
    const removeConnection = () => {
      if (clientRef.current && connectionIdRef.current) {
        const removeRequest = new ConnectionRequest();
        removeRequest.setConnectionId('client_457');
        removeRequest.setServiceName('web_browser1');

        // Call removeConnection - this might not complete if page is closing
        clientRef.current.removeConnection(removeRequest, {}, (err, response) => {
          if (err) {
            console.error('RemoveConnection error:', err.message);
          } else {
            console.log(`RemoveConnection response: success=${response.getSuccess()}, message="${response.getMessage()}"`);
          }
        });
        
        console.log(`Calling RemoveConnection for ${connectionIdRef.current}`);
      }
    };

    // Handle visibility change (tab hidden, minimized, or closed)
    // const handleVisibilityChange = () => {
    //   if (document.visibilityState === 'hidden') {
    //     removeConnection();
    //   }
    // };

    // // Handle page hide (more reliable for mobile/some browsers)
    // const handlePageHide = (e) => {
    //   removeConnection();
    // };

    // Handle beforeunload as last resort
    const handleBeforeUnload = (e) => {
      removeConnection();
    };

    // Register all event listeners for maximum reliability
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    // window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      // window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Cancel stream
      if (streamRef.current) {
        streamRef.current.cancel();
        console.log('Stream cancelled');
      }
      
      // Call removeConnection on unmount
      removeConnection();
    };
  }, []);

  const handleRemoveConnection = () => {
    if (clientRef.current && connectionIdRef.current) {
      const removeRequest = new ConnectionRequest();
      removeRequest.setConnectionId('client_457');
      removeRequest.setServiceName('web_browser1');

      addLog('Manually removing connection...', 'info');
      
      clientRef.current.removeConnection(removeRequest, {}, (err, response) => {
        if (err) {
          addLog(`RemoveConnection error: ${err.message}`, 'error');
        } else {
          addLog(`RemoveConnection response: { success: ${response.getSuccess()}, message: "${response.getMessage()}" }`, 'response');
          setConnectionStatus('Disconnected');
        }
      });
      
      if (streamRef.current) {
        streamRef.current.cancel();
        addLog('Stream cancelled', 'info');
      }
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ff4444';
      case 'notification': return '#00aa00';
      case 'heartbeat': return '#0088ff';
      case 'request': return '#ff8800';
      case 'response': return '#8800ff';
      default: return '#333333';
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '10px' }}>Hello</h1>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: connectionStatus === 'Connected' ? '#d4edda' : '#f8d7da',
        border: `1px solid ${connectionStatus === 'Connected' ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>Status:</strong> {connectionStatus}
      </div>

      <button 
        onClick={handleRemoveConnection}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '20px'
        }}
      >
        Remove Connection
      </button>

      <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Notification Logs</h2>
      
      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: '15px',
        borderRadius: '4px',
        maxHeight: '500px',
        overflowY: 'auto',
        fontFamily: 'Consolas, Monaco, monospace',
        fontSize: '12px'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#888' }}>Waiting for logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#888' }}>[{log.timestamp}]</span>{' '}
              <span style={{ color: getLogColor(log.type) }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        marginTop: '20px',
        fontSize: '12px',
        color: '#666',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
      }}>
        <strong>Note:</strong> This app connects to the gRPC server on localhost:8081 (Envoy proxy). 
        Make sure your gRPC server is running on localhost:50051 and Envoy proxy is running on localhost:8081.
      </div>
    </div>
  );
};

export default App;
