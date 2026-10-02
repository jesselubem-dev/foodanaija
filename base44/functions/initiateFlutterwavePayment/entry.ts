import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Returns the Flutterwave public key + tx_ref so the frontend can open the
// Flutterwave Inline (modal) checkout inside the app (no external redirect).
// The secret key is never exposed to the client; verification stays server-side.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tx_ref } = await req.json();
    if (!tx_ref) {
      return Response.json({ error: 'tx_ref is required' }, { status: 400 });
    }

    const publicKey = secrets.get('FLUTTERWAVE_PUBLIC_KEY');
    if (!publicKey) return Response.json({ error: 'Server configuration error' }, { status: 500 });

    return Response.json({ success: true, public_key: publicKey, tx_ref });
  } catch (error) {
    console.error('Initiate Flutterwave payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}