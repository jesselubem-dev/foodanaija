import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, delivery_status, rider_id } = await req.json();

    if (!order_id || !delivery_status) {
      return Response.json({ error: 'Order ID and delivery status required' }, { status: 400 });
    }

    // Verify rider exists and is active
    if (rider_id) {
      const riders = await base44.asServiceRole.entities.Rider.filter({ id: rider_id });
      if (riders.length === 0 || riders[0].status === 'suspended') {
        return Response.json({ error: 'Invalid or suspended rider' }, { status: 403 });
      }
    }

    // Get the order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Update order delivery status
    const updateData = { delivery_status };
    
    // If status is delivered, also update order status
    if (delivery_status === 'delivered') {
      updateData.status = 'delivered';
      
      // Increment rider's total deliveries
      if (order.rider_id) {
        const rider = await base44.asServiceRole.entities.Rider.filter({ id: order.rider_id });
        if (rider.length > 0) {
          await base44.asServiceRole.entities.Rider.update(order.rider_id, {
            total_deliveries: (rider[0].total_deliveries || 0) + 1
          });
        }
      }
    }

    await base44.asServiceRole.entities.Order.update(order_id, updateData);

    // Create notification for customer
    const notificationMessages = {
      'picked_up': 'Your order has been picked up by the delivery rider',
      'on_the_way': 'Your order is on the way!',
      'delivered': 'Your order has been delivered. Enjoy your meal!'
    };

    if (notificationMessages[delivery_status]) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: order.customer_email,
        title: 'Order Update',
        message: notificationMessages[delivery_status],
        type: 'order_delivered',
        order_id: order_id
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Delivery status updated successfully' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});