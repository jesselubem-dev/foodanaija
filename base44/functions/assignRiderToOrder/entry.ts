import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order details
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    const order = orders[0];

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find available riders
    const riders = await base44.asServiceRole.entities.Rider.filter({ 
      is_active: true, 
      is_available: true 
    });

    if (riders.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No available riders at the moment' 
      });
    }

    // Assign the first available rider (you can add logic for closest rider, best rating, etc.)
    const assignedRider = riders[0];

    // Update order with rider info
    await base44.asServiceRole.entities.Order.update(orderId, {
      rider_id: assignedRider.id,
      rider_name: assignedRider.full_name,
      delivery_status: 'assigned'
    });

    // Create notification for rider (if you have a Rider notification system)
    // For now, we'll just return success

    return Response.json({ 
      success: true, 
      rider: {
        id: assignedRider.id,
        name: assignedRider.full_name,
        phone: assignedRider.phone
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});