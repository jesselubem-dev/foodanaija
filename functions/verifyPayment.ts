import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await req.json();

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`
      }
    });

    const data = await response.json();

    if (!data.status) {
      return Response.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const paymentData = data.data;

    if (paymentData.status !== 'success') {
      return Response.json({ error: 'Payment was not successful' }, { status: 400 });
    }

    // Extract order data from metadata
    const orderData = JSON.parse(paymentData.metadata.order_data);

    // Create the order with payment confirmed
    const order = await base44.asServiceRole.entities.Order.create({
      ...orderData,
      payment_status: 'paid',
      payment_method: 'card',
      payment_reference: reference,
      amount_paid: paymentData.amount / 100 // Convert from kobo to naira
    });

    return Response.json({
      success: true,
      order: order,
      payment: {
        reference: paymentData.reference,
        amount: paymentData.amount / 100,
        paid_at: paymentData.paid_at
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});