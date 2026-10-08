import { QueryClient } from '@tanstack/react-query';

/**
 * Offline-first query client.
 *
 * Every successful query result is persisted to localStorage and hydrated
 * back on the next app load, so the customer app (restaurants, menus, promos,
 * reviews, etc.) is usable even with no connection. When the network is back,
 * React Query refetches in the background and the cache updates silently.
 */

const CACHE_KEY = 'fooda-rq-cache-v1';
const MAX_AGE = 1000 * 60 * 60 * 24; // keep persisted data for up to 24h
const SAVE_DEBOUNCE = 800; // ms

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: true, // auto-refresh when back online
			retry: (failureCount) => (navigator.onLine ? failureCount < 1 : false),
			staleTime: 10 * 60 * 1000, // 10 min — don't hammer the server on every mount
			gcTime: 30 * 60 * 1000, // 30 min in memory
		},
	},
});

// --- Hydrate persisted cache on startup ---------------------------------
try {
	const raw = localStorage.getItem(CACHE_KEY);
	if (raw) {
		const entries = JSON.parse(raw);
		const now = Date.now();
		for (const [keyStr, entry] of Object.entries(entries)) {
			if (entry?.timestamp && now - entry.timestamp < MAX_AGE) {
				try {
					queryClientInstance.setQueryData(JSON.parse(keyStr), entry.data);
				} catch { /* skip bad key */ }
			}
		}
	}
} catch { /* corrupt cache — ignore */ }

// --- Persist cache to localStorage (debounced) -------------------------
let saveTimer = null;
const persist = () => {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		try {
			const queries = queryClientInstance.getQueryCache().getAll();
			const entries = {};
			for (const q of queries) {
				if (q.state.status === 'success' && q.state.data !== undefined) {
					entries[JSON.stringify(q.queryKey)] = {
						data: q.state.data,
						timestamp: q.state.dataUpdatedAt || Date.now(),
					};
				}
			}
			localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
		} catch { /* storage full or unavailable — skip silently */ }
	}, SAVE_DEBOUNCE);
};

queryClientInstance.getQueryCache().subscribe(persist);