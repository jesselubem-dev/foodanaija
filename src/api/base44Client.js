import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

// Use Fooda's own login screen instead of the default hosted one
base44.auth.redirectToLogin = (nextUrl) => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/Login') return;
  let next = '/CustomerHome';
  try {
    const u = new URL(nextUrl || window.location.href, window.location.origin);
    if (u.origin === window.location.origin) next = u.pathname + u.search;
  } catch { /* keep default */ }
  window.location.href = `/Login?next=${encodeURIComponent(next)}`;
};

// Sign in with Google (or another provider) through the Base44 server directly.
// The SDK builds this link from the app's own domain, which doesn't serve /api routes.
base44.auth.loginWithProvider = (provider = 'google', fromUrl = '/CustomerHome') => {
  if (typeof window === 'undefined') return;
  const server = (serverUrl || 'https://base44.app').replace(/\/$/, '');
  const redirectUrl = new URL(fromUrl, window.location.origin).toString();
  const path = provider === 'google' ? '/api/apps/auth/login' : `/api/apps/auth/${provider}/login`;
  const url = `${server}${path}?app_id=${appId}&from_url=${encodeURIComponent(redirectUrl)}`;

  // Always open Google login in a centered popup so the app itself never
  // navigates away to an external URL. Falls back to a new tab if the
  // popup is blocked.
  const w = 500, h = 620;
  const popup = window.open(
    `${url}&popup_origin=${encodeURIComponent(window.location.origin)}`,
    'fooda_google_login',
    `width=${w},height=${h},left=${Math.round(window.screenX + (window.outerWidth - w) / 2)},top=${Math.round(window.screenY + (window.outerHeight - h) / 2)}`
  );
  if (!popup) { window.open(url, '_blank'); return; }
  const onMessage = (event) => {
    if (event.origin !== window.location.origin || event.source !== popup || !event.data?.access_token) return;
    window.removeEventListener('message', onMessage);
    clearInterval(timer);
    try { popup.close(); } catch { /* ignore */ }
    const back = new URL(redirectUrl);
    back.searchParams.set('access_token', event.data.access_token);
    window.location.href = back.toString();
  };
  const timer = setInterval(() => { if (popup.closed) { clearInterval(timer); window.removeEventListener('message', onMessage); } }, 500);
  window.addEventListener('message', onMessage);
};

// ---- Speed: share one "who am I" request across the whole app -------------
// Many screens call base44.auth.me() on open. Reuse the answer for a minute
// instead of asking the server again and again.
const ME_TTL = 60 * 1000;
let meCache = null; // { at, promise }
const rawMe = base44.auth.me.bind(base44.auth);
const clearMe = () => { meCache = null; };
base44.auth.me = () => {
  if (meCache && Date.now() - meCache.at < ME_TTL) return meCache.promise;
  const promise = rawMe().catch((err) => { clearMe(); throw err; });
  meCache = { at: Date.now(), promise };
  return promise;
};
const rawUpdateMe = base44.auth.updateMe.bind(base44.auth);
base44.auth.updateMe = async (data) => {
  const res = await rawUpdateMe(data);
  clearMe();
  return res;
};
for (const name of ['loginViaEmailPassword', 'logout', 'setToken']) {
  const fn = base44.auth[name]?.bind(base44.auth);
  if (fn) base44.auth[name] = (...args) => { clearMe(); return fn(...args); };
}

// Warm-up: if the user is already signed in, start fetching their profile right away,
// in parallel with the app's start-up checks (the result is shared via the cache above).
if (typeof window !== 'undefined' && token && window.location.pathname !== '/Login') {
  base44.auth.me().catch(() => {});
}