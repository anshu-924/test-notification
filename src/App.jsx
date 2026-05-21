import { useEffect, useState } from 'react';
import { logout as clearAuth, getDeviceId } from './auth/auth';
import { setAvailability } from './api/availability';
import { useNotification } from './notifications/useNotification';
import Login from './Login';

const App = () => {
  // Always start logged out: no auto-restore of a stored session, no default
  // connection. Connection happens only after a fresh login.
  const [auth, setAuth] = useState(null);

  if (!auth) {
    return <Login onLogin={setAuth} />;
  }

  return <Dashboard auth={auth} onLogout={() => setAuth(null)} />;
};

const Dashboard = ({ auth, onLogout }) => {
  const { status, logs, connect, disconnect, addLog } = useNotification();
  const [available, setAvailable] = useState(true);
  const [togglePending, setTogglePending] = useState(false);

  const clientId = auth.user.id;
  const deviceId = getDeviceId();

  // Attempt the connection once, right after login (vocallabsui pattern:
  // connect(user.id) gated on the authenticated user).
  useEffect(() => {
    connect(clientId, auth.authToken);
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAvailability = async () => {
    const next = !available;
    setTogglePending(true);
    addLog(
      `set_availability request: { client_id: "${clientId}", device_id: "${deviceId}", ready: ${next} }`,
      'request'
    );
    try {
      const res = await setAvailability(clientId, next);
      setAvailable(next);
      addLog(`set_availability response: ${JSON.stringify(res)}`, 'response');
    } catch (err) {
      addLog(`set_availability error: ${err.message}`, 'error');
    } finally {
      setTogglePending(false);
    }
  };

  const handleLogout = () => {
    addLog('Logout: disconnecting and clearing session...', 'info');
    disconnect();
    clearAuth();
    onLogout();
  };

  const isConnected = status === 'connected';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Notification Dashboard</h1>
          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
            User: {clientId}<br />Device: {deviceId}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          padding: '10px',
          marginTop: '16px',
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      >
        <strong>Status:</strong> {statusLabel}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          marginBottom: '20px',
        }}
      >
        <span style={{ fontWeight: 600 }}>Availability:</span>
        <span style={{ color: available ? '#00aa00' : '#dc3545', fontWeight: 600 }}>
          {available ? 'Available' : 'Unavailable'}
        </span>
        <button
          onClick={handleToggleAvailability}
          disabled={togglePending}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: available ? '#dc3545' : '#198754',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: togglePending ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            opacity: togglePending ? 0.6 : 1,
          }}
        >
          {togglePending ? 'Updating...' : available ? 'Set Unavailable' : 'Set Available'}
        </button>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Notification Logs</h2>
      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '4px',
          maxHeight: '500px',
          overflowY: 'auto',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '12px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#888' }}>Waiting for logs...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #333' }}
            >
              <span style={{ color: '#888' }}>[{log.timestamp}]</span>{' '}
              <span style={{ color: getLogColor(log.type), whiteSpace: 'pre-wrap' }}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
