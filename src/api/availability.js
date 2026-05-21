// Availability toggle → anora HTTP gateway POST /set_availability.
// Auth here is the X-API-KEY header (NOT the user's bearer token).
import { ANORA_HTTP_BASE, ANORA_API_KEY } from '../config';
import { getDeviceId } from '../auth/auth';

// Device-level toggle: marks only THIS dashboard's connection (client_id +
// device_id) available/unavailable. device_id must match the gRPC service_name.
export async function setAvailability(clientId, ready) {
  const deviceId = getDeviceId();
  const url =
    `${ANORA_HTTP_BASE}/set_availability` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&device_id=${encodeURIComponent(deviceId)}` +
    `&ready=${ready ? 'true' : 'false'}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-API-KEY': ANORA_API_KEY },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `set_availability failed (${res.status})`);
  }
  return json;
}
