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
