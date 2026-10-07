// Shared opening-hours helpers (same rules the home page uses).

const toMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export function isRestaurantOpen(restaurant) {
  if (!restaurant?.is_open) return false;
  const open = toMinutes(restaurant.opening_time);
  const close = toMinutes(restaurant.closing_time);
  if (open === null || close === null) return !!restaurant.is_open;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return close < open ? (cur >= open || cur <= close) : (cur >= open && cur <= close);
}

// "22:00" -> "10 PM", "22:30" -> "10:30 PM"
export function formatTime(hhmm) {
  const mins = toMinutes(hhmm);
  if (mins === null) return '';
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}
