// Fooda Naija currently serves Sokoto only.
// Customers must be within SERVICE_RADIUS_KM of Sokoto city centre to use the app.

export const SERVICE_CITY = 'Sokoto';
export const SERVICE_CENTER = { lat: 13.0622, lng: 5.2339 };
export const SERVICE_RADIUS_KM = 40; // covers Sokoto metropolis, Wamakko, Kware and Dange-Shuni edges

import { POPULAR_PLACES, SOKOTO_NORTH_AREAS, SOKOTO_SOUTH_AREAS } from './sokotoAreas';

const toArea = (group) => ([name, lat, lng]) => ({ name, lat, lng, group });
const byName = (x, y) => x.name.localeCompare(y.name);
export const POPULAR_AREAS = POPULAR_PLACES.map(toArea('popular'));
export const NORTH_AREAS = SOKOTO_NORTH_AREAS.map(toArea('north')).sort(byName);
export const SOUTH_AREAS = SOKOTO_SOUTH_AREAS.map(toArea('south')).sort(byName);
export const ALL_AREAS = [...POPULAR_AREAS, ...NORTH_AREAS, ...SOUTH_AREAS];

/** Closest mapped area to a GPS point (only suggested if within ~3 km). */
export function nearestArea(coords) {
  if (!coords) return null;
  let best = null;
  for (const a of ALL_AREAS) {
    if (a.lat == null) continue;
    const d = distanceKm(coords, a);
    if (!best || d < best.d) best = { area: a, d };
  }
  return best && best.d <= 3 ? best.area : null;
}

const KEY = 'fooda_location';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // re-check location weekly

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isInServiceArea(coords) {
  return distanceKm(coords, SERVICE_CENTER) <= SERVICE_RADIUS_KM;
}

export function getSavedLocation() {
  try {
    const loc = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!loc || !loc.verified_at) return null;
    if (Date.now() - loc.verified_at > MAX_AGE_MS) return null;
    return loc;
  } catch {
    return null;
  }
}

export function saveLocation(loc) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
    window.dispatchEvent(new Event('fooda-location'));
  } catch { /* storage unavailable */ }
}

export function clearLocation() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('fooda-location'));
  } catch { /* storage unavailable */ }
}

/** Resolves { lat, lng } or rejects with { code: 'denied' | 'unavailable' | 'unsupported' } */
export function getDevicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject({ code: 'unsupported' });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject({ code: err.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );
  });
}
