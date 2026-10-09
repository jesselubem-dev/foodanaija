import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * sendAbandonedCartNotification — called by the Abandoned Cart Reminder workflow
 * 15 minutes after a cart is first tracked. If the customer still hasn't checked
 * out, it sends a pleasing native push notification + an in-app notification,
 * then marks the cart as "notified" so it never fires twice.
 */

const APP_URL = 'https://foodanaija.base44.app';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { cart_id } = body || {};
    if (!cart_id) return Response.json({ success: false, error: 'cart_id required' }, { status: 400 });

    const cart = (await base44.asServiceRole.entities.AbandonedCart.filter({ id: cart_id }))[0];
    if (!cart) return Response.json({ success: false, reason: 'cart_not_found' });

    // Already checked out or already notified — do nothing.
    if (cart.status !== 'active') return Response.json({ success: true, reason: 'not_active', status: cart.status });

    // Find the user for the push notification.
    const users = await base44.asServiceRole.entities.User.filter({ email: cart.user_email });
    const user = users?.[0];

    const firstName = user?.full_name?.split(' ')[0] || 'there';
    const itemCount = cart.item_count || (cart.cart_items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const restaurantText = (cart.restaurant_names || []).length === 1
      ? cart.restaurant_names[0]
      : `${(cart.restaurant_names || []).length} restaurants`;

    const title = `Still craving? 🍴`;
    const message = `Hey ${firstName}, your order${itemCount > 1 ? ` of ${itemCount} items` : ''} from ${restaurantText} is still waiting in your cart. Tap to finish checkout and enjoy your meal!`;

    // 1. Native push notification
    let pushSent = false;
    if (user?.id) {
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: user.id,
          title,
          content: message,
          action_label: 'Complete Order',
          action_url: `${APP_URL}/Cart`,
        });
        pushSent = true;
      } catch (e) {
        console.warn('Abandoned cart push failed:', e?.message || e);
      }
    }

    // 2. In-app notification
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_email: cart.user_email,
        title,
        message,
        type: 'promo',
        link: 'Cart',
        is_read: false,
        metadata: {
          image_url: cart.cart_items?.[0]?.image_url || '',
        },
      });
    } catch (e) {
      console.warn('Abandoned cart in-app notification failed:', e?.message || e);
    }

    // 3. Mark as notified so the workflow never fires again for this cart
    await base44.asServiceRole.entities.AbandonedCart.update(cart.id, { status: 'notified' });

    return Response.json({ success: true, push_sent: pushSent });
  } catch (error) {
    console.error('sendAbandonedCartNotification failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}