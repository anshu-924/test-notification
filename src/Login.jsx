import { useState } from 'react';
import { sendOTP, verifyOTP } from './auth/auth';

// Two-step phone -> OTP login. On success, calls onLogin(auth).
const Login = ({ onLogin }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [countryCode, setCountryCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fullPhone = `+${countryCode}${phone}`;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendOTP(fullPhone);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await verifyOTP(fullPhone, otp);
      onLogin(auth);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: loading ? '#9ec5fe' : '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    marginTop: '12px',
  };

  return (
    <div style={{ maxWidth: '360px', margin: '40px auto' }}>
      <h1 style={{ marginBottom: '4px' }}>Sign in</h1>
      <p style={{ color: '#666', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>
        Log in with your registered phone number to connect to notifications.
      </p>

      {step === 'phone' && (
        <form onSubmit={handleSendOtp}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Phone number</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <input
              style={{ ...inputStyle, width: '70px' }}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))}
              aria-label="Country code"
            />
            <input
              style={inputStyle}
              type="tel"
              autoFocus
              required
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button style={buttonStyle} type="submit" disabled={loading || !phone}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerify}>
          <p style={{ fontSize: '13px', color: '#333' }}>
            Enter the code sent to <strong>{fullPhone}</strong>
          </p>
          <input
            style={inputStyle}
            type="text"
            inputMode="numeric"
            autoFocus
            required
            placeholder="One-time code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button style={buttonStyle} type="submit" disabled={loading || !otp}>
            {loading ? 'Verifying...' : 'Verify & Connect'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError(null);
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '8px',
              background: 'none',
              border: 'none',
              color: '#0d6efd',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Change phone number
          </button>
        </form>
      )}

      {error && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#842029',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Login;
