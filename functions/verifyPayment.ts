import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference, ordersData } = await req.json();
    
    if (!reference) {
      return Response.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return Response.json({ 
        success: false, 
        error: 'Payment verification failed' 
      }, { status: 400 });
    }

    // Payment successful, create orders
    const createdOrders = [];
    
    for (const order of ordersData) {
      const newOrder = await base44.asServiceRole.entities.Order.create({
        ...order,
        payment_status: 'paid',
        payment_reference: reference,
        amount_paid: verifyData.data.amount / 100
      });
      createdOrders.push(newOrder);
    }

    return Response.json({ 
      success: true, 
      orders: createdOrders,
      transaction: verifyData.data
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});