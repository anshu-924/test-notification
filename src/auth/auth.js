// Phone + OTP login, ported from vocallabsui's authApi (V4 flow with CAP.js).
// Trimmed to the two calls this dashboard needs: sendOTP + verifyOTP.
import { GRAPHQL_URL } from '../config';

const AUTH_KEY = 'auth'; // localStorage shape: { authToken, refreshToken, user: { id } }
const OTP_DEVICE_KEY = 'device_id'; // device id sent in verifyOTPV4 (matches vocallabsui)
const CONN_DEVICE_KEY = 'device_uuid'; // device id used as gRPC service_name + toggle device_id

const REGISTER_V4 = `
  mutation RegisterV4($phone: String!, $recaptcha_token: String!) {
    registerWithoutPasswordV4(credentials: {phone: $phone, recaptcha_token: $recaptcha_token}) {
      request_id
      status
    }
  }
`;

const VERIFY_OTP_V4 = `
  mutation VerifyOTPV4($otp: String = "", $phone: String = "", $device_data: jsonb = "", $device_id: String = "", $ip_address: String = "", $version: Int = 0, $lang: String = "") {
    verifyOTPV4(request: {otp: $otp, phone: $phone, device_data: $device_data, device_id: $device_id, ip_address: $ip_address, version: $version, lang: $lang}) {
      auth_token
      deviceInfoSaved
      id
      refresh_token
      status
    }
  }
`;

async function graphqlRequest(query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.errors && json.errors.length) {
    throw new Error(json.errors[0]?.message || 'GraphQL request failed');
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return json.data;
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreate(key) {
  let v = localStorage.getItem(key);
  if (!v) {
    v = uuid();
    localStorage.setItem(key, v);
  }
  return v;
}

// Device id used for the gRPC service_name and the availability toggle.
// Must be identical in both places so anora keys the connection consistently.
export function getDeviceId() {
  return getOrCreate(CONN_DEVICE_KEY);
}

async function getCapToken() {
  const cap = typeof window !== 'undefined' ? window.capInstance : null;
  if (!cap || !cap.getToken) {
    throw new Error('Security verification not ready. Please refresh the page and try again.');
  }
  const token = await cap.getToken();
  if (!token) throw new Error('Failed to get security token');
  return typeof token === 'string' ? token : JSON.stringify(token);
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function getOSName() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  if (/iPhone|iPad|iOS/.test(ua)) return 'iOS';
  return 'Unknown';
}

function getDeviceData() {
  return {
    browser: getBrowserName(),
    os: getOSName(),
    user_agent: navigator.userAgent || '',
    platform: navigator.platform || '',
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    timezone_offset: new Date().getTimezoneOffset(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    device_type: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
      ? 'mobile'
      : 'desktop',
  };
}

async function getIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || '';
  } catch {
    return '';
  }
}

// Step 1: request an SMS OTP for the given phone number.
export async function sendOTP(phone) {
  const formatted = phone.startsWith('+') ? phone : `+${phone}`;
  const capToken = await getCapToken();
  const data = await graphqlRequest(REGISTER_V4, {
    phone: formatted,
    recaptcha_token: capToken,
  });
  return data.registerWithoutPasswordV4;
}

// Step 2: verify the OTP, persist the auth, and return it.
export async function verifyOTP(phone, otp) {
  const formatted = phone.startsWith('+') ? phone : `+${phone}`;
  const deviceId = getOrCreate(OTP_DEVICE_KEY);
  const ip = await getIp();

  const data = await graphqlRequest(VERIFY_OTP_V4, {
    phone: formatted,
    otp,
    device_data: { ...getDeviceData(), location: { ip } },
    device_id: deviceId,
    ip_address: ip,
    version: 0,
    lang: (typeof navigator !== 'undefined' && navigator.language) || 'en',
  });

  const r = data.verifyOTPV4;
  if (!r || !r.auth_token || !r.id) {
    throw new Error('Invalid verification response');
  }

  const auth = {
    authToken: r.auth_token,
    refreshToken: r.refresh_token,
    user: { id: r.id },
  };
  saveAuth(auth);
  return auth;
}

export function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getStoredAuth() {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
