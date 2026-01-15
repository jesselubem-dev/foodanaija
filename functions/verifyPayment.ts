import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return Response.json({ success: false, message: 'Payment not verified' });
    }

    // Create orders in database
    const createdOrders = [];
    for (const orderData of ordersData) {
      const order = await base44.entities.Order.create({
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
        batch_order_id: orderData.batch_order_id || null,
        total_restaurants_in_batch: orderData.total_restaurants_in_batch || 1
      });
      createdOrders.push(order);
    }

    return Response.json({ success: true, orders: createdOrders });
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});