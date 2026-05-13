/**
 * Returns the VAS (Value Added Service) fee for a single restaurant's subtotal.
 * Tiers:
 *   ₦0    – ₦4,999  → ₦300
 *   ₦5,000 – ₦9,999  → ₦700
 *   ₦10,000 – ₦24,999 → ₦1,500
 *   ₦25,000+           → ₦3,000
 */
export function getVASForSubtotal(subtotal) {
  if (subtotal >= 25000) return 3000;
  if (subtotal >= 10000) return 1500;
  if (subtotal >= 5000) return 700;
  return 300;
}

/**
 * Given a cart array (each item has restaurant_id, price, quantity),
 * returns the total VAS by summing each restaurant's individual VAS tier.
 */
export function calculateTotalVAS(cart) {
  const byRestaurant = {};
  cart.forEach(item => {
    if (!byRestaurant[item.restaurant_id]) byRestaurant[item.restaurant_id] = 0;
    byRestaurant[item.restaurant_id] += item.price * item.quantity;
  });
  return Object.values(byRestaurant).reduce((sum, sub) => sum + getVASForSubtotal(sub), 0);
}