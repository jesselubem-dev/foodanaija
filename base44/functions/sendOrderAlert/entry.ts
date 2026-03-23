import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ALERT_EMAILS = [
  'emmanuelejio1318@gmail.com',
  'foodanaija@gmail.com',
  'htechhub.consult@gmail.com',
  'jesselubem@gmail.com',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event, skipped.' });
    }

    const order = data;
    if (!order) {
      return Response.json({ success: false, message: 'No order data found.' });
    }

    const itemsList = (order.items || [])
      .map(i => `• ${i.name} x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');

    const subject = `🍔 New Order Alert — ${order.restaurant_name || 'Fooda Naija'}`;
    const body = `
<h2 style="color:#f97316;">🛍️ New Order Received!</h2>
<p><strong>Restaurant:</strong> ${order.restaurant_name || 'N/A'}</p>
<p><strong>Customer:</strong> ${order.customer_name || 'N/A'} (${order.customer_email || ''})</p>
<p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
<p><strong>Delivery Address:</strong> ${order.delivery_address || 'N/A'}</p>
<hr/>
<h3>Items Ordered:</h3>
<pre style="background:#f9f9f9;padding:10px;border-radius:8px;">${itemsList}</pre>
<hr/>
<p><strong>Subtotal:</strong> ₦${(order.subtotal || 0).toLocaleString()}</p>
<p><strong>Delivery Fee:</strong> ₦${(order.delivery_fee || 0).toLocaleString()}</p>
<p><strong>Total:</strong> <span style="color:#16a34a;font-size:18px;font-weight:bold;">₦${(order.total || 0).toLocaleString()}</span></p>
<p><strong>Payment Status:</strong> ${order.payment_status || 'pending'}</p>
<p><strong>Notes:</strong> ${order.notes || 'None'}</p>
<br/>
<p style="color:#9ca3af;font-size:12px;">This alert was sent automatically by Fooda Naija.</p>
    `.trim();

    // Send to all alert emails in parallel
    await Promise.all(
      ALERT_EMAILS.map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body,
          from_name: 'Fooda Naija Orders',
        })
      )
    );

    return Response.json({ success: true, message: `Order alert sent to ${ALERT_EMAILS.length} recipients.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});