/**
 * Thin Google Places client. Two endpoints:
 *   - Autocomplete: suggests cities/places as the user types.
 *   - Place Details: resolves a place_id to lat/lng + formatted address.
 *
 * Uses the legacy Places (web service) endpoints, which work fine from a
 * native client (no CORS) and require only an API key.
 */

import { GOOGLE_PLACES_API_KEY } from './config';

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

let sessionToken = null;
function newSession() {
  sessionToken = `ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return sessionToken;
}

/**
 * Search for places by free-text input. Returns up to 5 predictions.
 * Restricted to (regions) so users get cities, neighborhoods, etc — not
 * individual restaurants. Pass `types: 'establishment'` etc. to widen.
 *
 * @param {string} input
 * @param {{ signal?: AbortSignal, types?: string }} [options]
 * @returns {Promise<{ id: string, primary: string, secondary: string }[]>}
 */
export async function searchPlaces(input, { signal, types = '(regions)' } = {}) {
  const q = (input || '').trim();
  if (q.length < 2) return [];
  if (!sessionToken) newSession();

  const params = new URLSearchParams({
    input: q,
    types,
    sessiontoken: sessionToken,
    key: GOOGLE_PLACES_API_KEY,
  });

  const res = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Places autocomplete failed: ${res.status}`);
  const json = await res.json();

  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places autocomplete error: ${json.status} ${json.error_message || ''}`);
  }

  return (json.predictions || []).map((p) => ({
    id: p.place_id,
    primary: p.structured_formatting?.main_text || p.description,
    secondary: p.structured_formatting?.secondary_text || '',
    raw: p,
  }));
}

/**
 * Resolve a place_id to lat/lng + a clean display name.
 * Reuses the current session token (Google bills autocomplete + 1 details
 * call as a single session).
 *
 * @param {string} placeId
 * @returns {Promise<{ name: string, shortName: string, lat: number, lng: number }>}
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) throw new Error('placeId required');

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,name,formatted_address',
    sessiontoken: sessionToken || newSession(),
    key: GOOGLE_PLACES_API_KEY,
  });

  const res = await fetch(`${DETAILS_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Places details failed: ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(`Places details error: ${json.status} ${json.error_message || ''}`);
  }

  const r = json.result;
  // Session token is consumed once details is called.
  sessionToken = null;

  return {
    name: r.formatted_address || r.name,
    shortName: r.name,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
  };
}
