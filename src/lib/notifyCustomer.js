// Tell the server something changed so it can notify the customer in-app.
// The server reads the real record, picks the right message and never sends
// the same update twice — so these are safe to call after any status change.
// Failures are logged but never block the screen that called them.
import { base44 } from '@/api/base44Client';

export function notifyOrderUpdated(orderId) {
  if (!orderId) return Promise.resolve();
  return base44.functions
    .invoke('notifyCustomer', { event: 'order_updated', order_id: orderId })
    .catch((e) => console.warn('notifyCustomer (order) failed:', e?.message || e));
}

export function notifyRestaurantOpen(restaurantId) {
  if (!restaurantId) return Promise.resolve();
  return base44.functions
    .invoke('notifyCustomer', { event: 'restaurant_open', restaurant_id: restaurantId })
    .catch((e) => console.warn('notifyCustomer (restaurant) failed:', e?.message || e));
}

export function notifyRestaurantClosed(restaurantId) {
  if (!restaurantId) return Promise.resolve();
  return base44.functions
    .invoke('notifyCustomer', { event: 'restaurant_closed', restaurant_id: restaurantId })
    .catch((e) => console.warn('notifyCustomer (restaurant closed) failed:', e?.message || e));
}