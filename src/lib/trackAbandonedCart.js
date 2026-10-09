import { base44 } from '@/api/base44Client';

const CART_TRACK_KEY = 'abandoned_cart_id';

/**
 * Syncs the current localStorage cart to the server so the Abandoned Cart
 * Reminder workflow can fire a push notification 15 minutes later if the
 * customer leaves without checking out.
 *
 * Creates a new AbandonedCart record on the first item, then updates it as
 * items change. Call markCartCompleted() when the order is placed or the
 * cart is cleared.
 */
export async function syncAbandonedCart(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    await markCartCompleted();
    return;
  }
  try {
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return;

    const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const restaurantNames = [...new Set(cartItems.map(i => i.restaurant_name).filter(Boolean))];
    const cartItemsLite = cartItems.map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image_url || '',
      restaurant_name: i.restaurant_name || '',
    }));

    const existingId = localStorage.getItem(CART_TRACK_KEY);
    if (existingId) {
      await base44.entities.AbandonedCart.update(existingId, {
        cart_items: cartItemsLite,
        item_count: itemCount,
        total,
        restaurant_names: restaurantNames,
      });
    } else {
      const record = await base44.entities.AbandonedCart.create({
        user_email: user.email,
        cart_items: cartItemsLite,
        item_count: itemCount,
        total,
        restaurant_names: restaurantNames,
        status: 'active',
      });
      if (record?.id) localStorage.setItem(CART_TRACK_KEY, record.id);
    }
  } catch (e) {
    console.warn('syncAbandonedCart failed:', e?.message || e);
  }
}

/** Marks the tracked cart as completed so the reminder never fires. */
export async function markCartCompleted() {
  try {
    const existingId = localStorage.getItem(CART_TRACK_KEY);
    if (!existingId) return;
    await base44.entities.AbandonedCart.update(existingId, { status: 'completed' });
    localStorage.removeItem(CART_TRACK_KEY);
  } catch (e) {
    console.warn('markCartCompleted failed:', e?.message || e);
  }
}