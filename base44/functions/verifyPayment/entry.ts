import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference, ordersData } = await req.json();

    if (!reference || !ordersData) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paystackData = await verifyResponse.json();

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return Response.json({ success: false, message: 'Payment not verified' });
    }

    // Check if orders already fully created for this reference (payment_status = 'paid')
    const existingPaidOrders = await base44.asServiceRole.entities.Order.filter({ payment_reference: reference, payment_status: 'paid' });
    if (existingPaidOrders && existingPaidOrders.length > 0) {
      console.log(`Orders already paid for reference ${reference}, returning existing orders`);
      return Response.json({ success: true, orders: existingPaidOrders });
    }

    // Find pre-saved "initiated" orders for this reference (created before Paystack opened)
    const initiatedOrders = await base44.asServiceRole.entities.Order.filter({ payment_reference: reference, payment_status: 'initiated' });
    console.log(`Found ${initiatedOrders.length} initiated order(s) for reference ${reference}`);

    const createdOrders = [];
    const errors = [];

    for (const orderData of ordersData) {
      try {
        if (orderData.isDrinkOrder) {
          // Drink orders — always create fresh
          const drinkOrder = await base44.asServiceRole.entities.DrinkOrder.create({
            customer_email: orderData.customer_email,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            delivery_address: orderData.delivery_address,
            drinks: orderData.drinks,
            total: orderData.total,
            status: 'pending',
            payment_status: 'paid',
            payment_reference: reference,
            batch_order_id: orderData.batch_order_id || null
          });
          createdOrders.push(drinkOrder);
        } else {
          // Try to find the matching initiated order to UPDATE it
          const initiated = initiatedOrders.find(o => o.restaurant_id === orderData.restaurant_id);

          if (initiated) {
            // Update existing initiated order to paid
            const updated = await base44.asServiceRole.entities.Order.update(initiated.id, {
              customer_phone: orderData.customer_phone,
              status: 'pending',
              payment_status: 'paid',
              amount_paid: orderData.total,
              promo_code: orderData.promo_code || null,
              promo_code_id: orderData.promo_code_id || null,
            });
            createdOrders.push(updated);
          } else {
            // No initiated record found — create fresh
            const order = await base44.asServiceRole.entities.Order.create({
              restaurant_id: orderData.restaurant_id,
              restaurant_name: orderData.restaurant_name,
              customer_email: orderData.customer_email,
              customer_name: orderData.customer_name,
              customer_phone: orderData.customer_phone,
              delivery_address: orderData.delivery_address,
              items: orderData.items,
              subtotal: orderData.subtotal,
              delivery_fee: orderData.delivery_fee,
              total: orderData.total,
              notes: orderData.notes,
              status: 'pending',
              payment_status: 'paid',
              payment_method: 'card',
              payment_reference: reference,
              amount_paid: orderData.total,
              promo_code: orderData.promo_code || null,
              promo_code_id: orderData.promo_code_id || null,
              batch_order_id: orderData.batch_order_id || null,
              total_restaurants_in_batch: orderData.total_restaurants_in_batch || 1
            });
            createdOrders.push(order);
          }

          // Create notification for customer
          const finalOrder = createdOrders[createdOrders.length - 1];
          try {
            await base44.asServiceRole.entities.Notification.create({
              user_email: orderData.customer_email,
              title: 'Order Placed Successfully! 🎉',
              message: `Your order from ${orderData.restaurant_name} has been placed. Total: ₦${orderData.total.toLocaleString()}`,
              type: 'order_accepted',
              order_id: finalOrder.id,
              metadata: {
                image_url: orderData.items[0]?.image_url || ''
              }
            });
          } catch (notifError) {
            console.error('Failed to create notification (non-critical):', notifError);
          }
        }
      } catch (orderError) {
        console.error('Failed to process order:', orderError);
        errors.push({ orderData, error: orderError.message });
      }
    }

    if (createdOrders.length > 0 || errors.length === 0) {
      return Response.json({ success: true, orders: createdOrders, errors });
    }

    return Response.json({
      success: false,
      error: 'Failed to create any orders',
      errors
    }, { status: 500 });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Payment verification failed'
    }, { status: 500 });
  }
});