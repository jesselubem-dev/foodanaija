import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * notifyCustomer — the single place that creates in-app notifications for customers.
 *
 * Callers only say WHAT changed; this function reads the record's real current state,
 * picks the matching message, and never sends the same update twice. That makes it safe
 * to call from any screen (restaurant dashboard, rider app, admin) and safe to call
 * more than once.
 *
 * Body:
 *   { event: 'order_updated', order_id }          -> notifies the order's customer (in-app + push)
 *   { event: 'restaurant_open', restaurant_id }   -> notifies past customers (in-app + push)
 *   { event: 'restaurant_closed', restaurant_id } -> notifies past customers (in-app + push)
 */

const ORDER_LINK = 'OrderHistory';
const APP_URL = 'https://foodanaija.base44.app';
const RESTAURANT_COOLDOWN_HOURS = 12;   // at most one open/closed notice per restaurant per 12h
const RESTAURANT_MAX_RECIPIENTS = 500;
const PUSH_BATCH = 6;

// Send a native push notification to the order's customer (server-side only).
async function sendOrderPush(base44, order, msg) {
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: order.customer_email });
    const user = users?.[0];
    if (!user?.id) return { push: false, reason: 'user_not_found' };

    await base44.asServiceRole.integrations.Core.SendPushNotification({
      user_id: user.id,
      title: msg.title,
      content: msg.message,
      action_label: 'View Order',
      action_url: `${APP_URL}/OrderHistory`,
    });
    return { push: true };
  } catch (e) {
    console.warn('Push notification failed:', e?.message || e);
    return { push: false, reason: e?.message || 'error' };
  }
}

// Send a native push notification to every app user whose email is in the list.
async function sendPushToEmails(base44, emails, title, message, link) {
  if (!emails.length) return { push_sent: 0, push_failed: 0 };
  try {
    const users = await base44.asServiceRole.entities.User.list();
    const emailSet = new Set(emails.map(e => e.toLowerCase()));
    const targets = (users || []).filter(u => u.email && emailSet.has(u.email.toLowerCase()));

    let sent = 0, failed = 0;
    for (let i = 0; i < targets.length; i += PUSH_BATCH) {
      const batch = targets.slice(i, i + PUSH_BATCH);
      const results = await Promise.allSettled(batch.map(u =>
        base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: u.id,
          title,
          content: message,
          action_label: 'Open App',
          action_url: `${APP_URL}/${link}`,
        })
      ));
      for (const r of results) {
        if (r.status === 'fulfilled') sent++;
        else failed++;
      }
    }
    return { push_sent: sent, push_failed: failed };
  } catch (e) {
    console.warn('Push batch failed:', e?.message || e);
    return { push_sent: 0, push_failed: 0 };
  }
}

// Which customer-facing step an order is at right now (null = nothing to announce).
function orderStep(order) {
  if (order.payment_status !== 'paid') return null; // never notify about unpaid checkouts
  const ds = order.delivery_status;
  if (order.status === 'cancelled') return 'order_cancelled';
  if (order.status === 'declined') return 'order_declined';
  if (order.status === 'delivered' || ds === 'delivered') return 'order_delivered';
  if (ds === 'on_the_way') return 'order_on_the_way';
  if (ds === 'picked_up') return 'order_picked_up';
  if (order.status === 'accepted' && ds === 'assigned' && order.rider_id) return 'rider_assigned';
  if (order.status === 'accepted') return 'order_accepted';
  return null; // pending: the "order placed" notice is sent by payment verification
}

function orderMessage(step, order) {
  const r = order.restaurant_name || 'The restaurant';
  const rider = order.rider_name || 'Your rider';
  switch (step) {
    case 'order_accepted':   return { title: 'Order accepted 👨‍🍳', message: `${r} accepted your order and is preparing it now.` };
    case 'rider_assigned':   return { title: 'Rider assigned 🛵', message: `${rider} will pick up your food from ${r}.` };
    case 'order_picked_up':  return { title: 'Order picked up', message: `${rider} has collected your food from ${r}.` };
    case 'order_on_the_way': return { title: 'On the way to you 🛵', message: `${rider} is heading to your address now.` };
    case 'order_delivered':  return { title: 'Delivered — enjoy! 🍽️', message: `Your order from ${r} has been delivered. Tap to rate your experience.` };
    case 'order_declined':   return { title: 'Order declined', message: `Sorry, ${r} can't take your order right now. Please contact support about your payment.` };
    case 'order_cancelled':  return { title: 'Order cancelled', message: `Your order from ${r} was cancelled.` };
    default: return null;
  }
}

async function handleOrderUpdated(base44, orderId) {
  const order = (await base44.asServiceRole.entities.Order.filter({ id: orderId }))[0];
  if (!order) return { sent: 0, reason: 'order_not_found' };

  const step = orderStep(order);
  if (!step) return { sent: 0, reason: 'nothing_to_announce' };

  // Dedupe on the step (stored in metadata.event) so each step is announced once.
  const existing = await base44.asServiceRole.entities.Notification.filter({ order_id: order.id });
  if (existing.some(n => n.metadata?.event === step)) return { sent: 0, reason: 'already_sent', step };

  const msg = orderMessage(step, order);
  await base44.asServiceRole.entities.Notification.create({
    user_email: order.customer_email,
    title: msg.title,
    message: msg.message,
    type: step,
    order_id: order.id,
    restaurant_id: order.restaurant_id,
    link: ORDER_LINK,
    is_read: false,
    metadata: { event: step, image_url: order.items?.[0]?.image_url || '' },
  });

  // Also fire a native push to the customer's phone (order accepted + tracking updates).
  const push = await sendOrderPush(base44, order, msg);

  return { sent: 1, step, push };
}

// One per customer (case-insensitive), capped.
async function getPastCustomers(base44, restaurantId) {
  const orders = await base44.asServiceRole.entities.Order.filter(
    { restaurant_id: restaurantId, payment_status: 'paid' }, '-created_date', 2000
  );
  const byLower = new Map();
  for (const o of orders) {
    const e = (o.customer_email || '').trim();
    if (e && !byLower.has(e.toLowerCase())) byLower.set(e.toLowerCase(), e);
  }
  return [...byLower.values()].slice(0, RESTAURANT_MAX_RECIPIENTS);
}

// Create in-app notification records in chunks.
async function createNotifications(base44, records) {
  let sent = 0;
  for (let i = 0; i < records.length; i += 50) {
    const chunk = records.slice(i, i + 50);
    try {
      await base44.asServiceRole.entities.Notification.bulkCreate(chunk);
      sent += chunk.length;
    } catch (_e) {
      for (const rec of chunk) {
        try { await base44.asServiceRole.entities.Notification.create(rec); sent++; } catch (_err) { /* skip */ }
      }
    }
  }
  return sent;
}

// True if a notification of this type was sent for this restaurant recently.
async function isOnCooldown(base44, type, restaurantId) {
  const recent = await base44.asServiceRole.entities.Notification.filter(
    { type, restaurant_id: restaurantId }, '-created_date', 1
  );
  const cutoff = Date.now() - RESTAURANT_COOLDOWN_HOURS * 3600 * 1000;
  return !!(recent[0] && new Date(recent[0].created_date).getTime() > cutoff);
}

async function handleRestaurantOpen(base44, restaurantId) {
  const restaurant = (await base44.asServiceRole.entities.Restaurant.filter({ id: restaurantId }))[0];
  if (!restaurant) return { sent: 0, reason: 'restaurant_not_found' };
  if (!restaurant.is_open || !restaurant.is_approved) return { sent: 0, reason: 'not_open' };

  if (await isOnCooldown(base44, 'restaurant_open', restaurant.id)) {
    return { sent: 0, reason: 'cooldown' };
  }

  const emails = await getPastCustomers(base44, restaurant.id);
  if (emails.length === 0) return { sent: 0, reason: 'no_past_customers' };

  const title = `${restaurant.name} is open now 🍽️`;
  const message = `Your favourites are back on the menu. Order now — delivery in about ${restaurant.delivery_time || '30-45 mins'}.`;
  const link = `RestaurantDetail?id=${restaurant.id}`;
  const records = emails.map(email => ({
    user_email: email,
    title,
    message,
    type: 'restaurant_open',
    restaurant_id: restaurant.id,
    link,
    is_read: false,
    metadata: { event: 'restaurant_open', image_url: restaurant.cover_image_url || restaurant.logo_url || '' },
  }));

  const sent = await createNotifications(base44, records);
  const push = await sendPushToEmails(base44, emails, title, message, link);
  return { sent, ...push };
}

async function handleRestaurantClosed(base44, restaurantId) {
  const restaurant = (await base44.asServiceRole.entities.Restaurant.filter({ id: restaurantId }))[0];
  if (!restaurant) return { sent: 0, reason: 'restaurant_not_found' };
  if (restaurant.is_open) return { sent: 0, reason: 'still_open' };

  if (await isOnCooldown(base44, 'restaurant_closed', restaurant.id)) {
    return { sent: 0, reason: 'cooldown' };
  }

  const emails = await getPastCustomers(base44, restaurant.id);
  if (emails.length === 0) return { sent: 0, reason: 'no_past_customers' };

  const title = `${restaurant.name} is now closed 🔒`;
  const message = `${restaurant.name} has closed for now. Check back later for your favourite meals.`;
  const link = `RestaurantDetail?id=${restaurant.id}`;
  const records = emails.map(email => ({
    user_email: email,
    title,
    message,
    type: 'restaurant_closed',
    restaurant_id: restaurant.id,
    link,
    is_read: false,
    metadata: { event: 'restaurant_closed', image_url: restaurant.cover_image_url || restaurant.logo_url || '' },
  }));

  const sent = await createNotifications(base44, records);
  const push = await sendPushToEmails(base44, emails, title, message, link);
  return { sent, ...push };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { event, order_id, restaurant_id } = body || {};

    if (event === 'order_updated' && order_id) {
      return Response.json({ success: true, ...(await handleOrderUpdated(base44, order_id)) });
    }
    if (event === 'restaurant_open' && restaurant_id) {
      return Response.json({ success: true, ...(await handleRestaurantOpen(base44, restaurant_id)) });
    }
    if (event === 'restaurant_closed' && restaurant_id) {
      return Response.json({ success: true, ...(await handleRestaurantClosed(base44, restaurant_id)) });
    }
    return Response.json({ success: false, error: 'Unknown event' }, { status: 400 });
  } catch (error) {
    console.error('notifyCustomer failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}