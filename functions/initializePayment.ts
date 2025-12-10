import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, amount, orderData } = await req.json();

    // Initialize Paystack payment
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        metadata: {
          order_data: JSON.stringify(orderData),
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: orderData.customer_name
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!data.status) {
      return Response.json({ error: data.message }, { status: 400 });
    }

    return Response.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});