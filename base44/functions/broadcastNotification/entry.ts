import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * broadcastNotification — admin-only broadcast.
 * Creates an in-app Notification record for every app user AND sends a native
 * push notification to each user's device. Used by the Super Admin "Broadcast"
 * screen to send custom announcements/promotions to the whole user base.
 *
 * Body: { title, message, link?, image_url? }
 */
const APP_URL = 'https://foodanaija.base44.app';
const PUSH_BATCH = 6;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user._app_role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, message, link, image_url } = body || {};
    if (!title || !message) {
      return Response.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const targetLink = link || 'CustomerHome';

    // Every registered app user.
    const users = await base44.asServiceRole.entities.User.list();

    // 1. In-app notification records (chunked bulk insert).
    const records = users.map(u => ({
      user_email: u.email,
      title,
      message,
      type: 'promo',
      link: targetLink,
      is_read: false,
      metadata: { event: 'broadcast', image_url: image_url || '' },
    }));

    let notifCreated = 0;
    for (let i = 0; i < records.length; i += 50) {
      const chunk = records.slice(i, i + 50);
      try {
        await base44.asServiceRole.entities.Notification.bulkCreate(chunk);
        notifCreated += chunk.length;
      } catch (_e) {
        for (const rec of chunk) {
          try { await base44.asServiceRole.entities.Notification.create(rec); notifCreated++; } catch (_err) { /* skip one */ }
        }
      }
    }

    // 2. Native push notifications (batched to respect connection limits).
    let pushSent = 0;
    let pushFailed = 0;
    for (let i = 0; i < users.length; i += PUSH_BATCH) {
      const batch = users.slice(i, i + PUSH_BATCH);
      const results = await Promise.allSettled(batch.map(u =>
        base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: u.id,
          title,
          content: message,
          action_label: 'Open App',
          action_url: `${APP_URL}/${targetLink}`,
        })
      ));
      for (const r of results) {
        if (r.status === 'fulfilled') pushSent++;
        else pushFailed++;
      }
    }

    return Response.json({
      success: true,
      total_users: users.length,
      notifications_created: notifCreated,
      push_sent: pushSent,
      push_failed: pushFailed,
    });
  } catch (error) {
    console.error('broadcastNotification failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}