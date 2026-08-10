// Shared logic for reconciling Paystack payments against pre-saved "initiated" orders.
// Used by the Paystack webhook and the admin re-verify function so logic is not duplicated.

export async function markOrdersPaidByReference(base44, reference) {
  const initiatedOrders = await base44.asServiceRole.entities.Order.filter({
    payment_reference: reference,
    payment_status: 'initiated'
  });

  const updated = [];
  for (const order of initiatedOrders) {
    try {
      const result = await base44.asServiceRole.entities.Order.update(order.id, {
        status: 'pending',
        payment_status: 'paid',
        amount_paid: order.total
      });
      updated.push(result);

      try {
        await base44.asServiceRole.entities.Notification.create({
          user_email: order.customer_email,
          title: 'Order Placed Successfully! 🎉',
          message: `Your order from ${order.restaurant_name} has been placed. Total: ₦${order.total?.toLocaleString()}`,
          type: 'order_accepted',
          order_id: order.id,
          metadata: { image_url: order.items?.[0]?.image_url || '' }
        });
      } catch (notifError) {
        console.error('Notification failed (non-critical):', notifError);
      }
    } catch (orderError) {
      console.error('Failed to update order:', orderError);
    }
  }

  return updated;
}