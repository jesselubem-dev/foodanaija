import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Initializes a Flutterwave Standard (redirect) payment for a checkout.
// Returns the hosted checkout link the frontend redirects the user to.
// Only the secret key is needed (server-side); no public key required.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, email, name, phone, tx_ref } = await req.json();
    if (!amount || !email || !tx_ref) {
      return Response.json({ error: 'amount, email and tx_ref are required' }, { status: 400 });
    }

    const secretKey = secrets.get('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'Server configuration error' }, { status: 500 });

    // Redirect back to the app's OrderConfirmation page after the user pays.
    // Prefer the origin the request came from (works with custom domains too).
    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const redirect_url = `${origin}/OrderConfirmation`;

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount: String(amount),
        currency: 'NGN',
        redirect_url,
        payment_options: 'card,ussd,banktransfer,account,mobilemoney',
        customer: {
          email,
          phonenumber: phone || '',
          name: name || ''
        },
        customizations: {
          title: 'Fooda Naija',
          description: 'Order payment',
          logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png'
        }
      })
    });

    const data = await response.json();
    if (!data.status || !data.data?.link) {
      return Response.json({ success: false, error: data.message || 'Failed to initialize payment' }, { status: 400 });
    }

    return Response.json({ success: true, payment_link: data.data.link });
  } catch (error) {
    console.error('Initiate Flutterwave payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}