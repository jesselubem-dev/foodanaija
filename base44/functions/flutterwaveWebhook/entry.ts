import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { markOrdersPaidByReference } from "../../shared/flutterwaveReconcile.ts";

// Flutterwave webhook endpoint — called by Flutterwave server-to-server on payment events.
// No user auth. Authenticity is guaranteed by re-verifying the transaction via the
// Flutterwave API with the secret key (an attacker cannot forge a successful verify response).
export default async function(req) {
  try {
    const secretKey = secrets.get('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const rawBody = await req.text();
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Extract the transaction id from either webhook payload format Flutterwave uses.
    const txId = payload?.data?.id || payload?.id || payload?.TransactionId;
    if (!txId) {
      return Response.json({ received: true, message: 'No transaction id' });
    }

    // Re-verify the transaction with Flutterwave (authoritative source of truth).
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${txId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const flwData = await verifyResponse.json();

    if (!flwData.status || flwData.data?.status !== 'successful') {
      return Response.json({ received: true, message: 'Transaction not successful' });
    }

    const reference = flwData.data.tx_ref;
    if (!reference) {
      return Response.json({ error: 'No tx_ref in verified transaction' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const updated = await markOrdersPaidByReference(base44, reference);

    console.log(`Flutterwave webhook: marked ${updated.length} order(s) paid for reference ${reference}`);
    return Response.json({ received: true, updated: updated.length });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}