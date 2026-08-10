import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { markOrdersPaidByReference } from "../../shared/paystackReconcile.ts";

// Admin-only: re-verifies a Paystack reference and marks any stuck "initiated"
// orders as paid if Paystack confirms the transaction was successful.
// Used to reconcile abandoned checkouts where the customer actually paid.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user._app_role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { reference } = await req.json();
    if (!reference) {
      return Response.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const secretKey = secrets.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify the transaction with Paystack
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
      return Response.json({
        success: false,
        message: 'Paystack did not confirm this payment as successful — money did not go through.'
      });
    }

    const updated = await markOrdersPaidByReference(base44, reference);

    if (updated.length === 0) {
      return Response.json({
        success: false,
        message: 'Payment confirmed by Paystack, but no initiated orders found for this reference (they may already be paid).'
      });
    }

    return Response.json({
      success: true,
      updated: updated.length,
      message: `Payment confirmed — ${updated.length} order(s) marked as paid.`
    });
  } catch (error) {
    console.error('Reverify payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}