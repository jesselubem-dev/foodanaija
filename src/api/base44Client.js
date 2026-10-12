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

  let inFrame = false;
  try { inFrame = window.self !== window.top; } catch { inFrame = true; }
  if (!inFrame) { window.location.href = url; return; }

  // Inside the Base44 editor preview Google can't load in a frame, so use a popup
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
