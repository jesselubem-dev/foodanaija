import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { markOrdersPaidByReference } from "../../shared/paystackReconcile.ts";

// Paystack webhook endpoint — called by Paystack server-to-server on payment events.
// No user auth; authenticity is verified via Paystack's HMAC SHA512 signature.
export default async function(req) {
  try {
    const secretKey = secrets.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return Response.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify HMAC SHA512 signature of the raw body
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
    const computedSig = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSig !== signature) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Only act on successful charges
    if (payload.event !== 'charge.success') {
      return Response.json({ received: true });
    }

    const reference = payload.data?.reference;
    if (!reference) {
      return Response.json({ error: 'No reference in payload' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const updated = await markOrdersPaidByReference(base44, reference);

    console.log(`Webhook: marked ${updated.length} order(s) paid for reference ${reference}`);
    return Response.json({ received: true, updated: updated.length });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}