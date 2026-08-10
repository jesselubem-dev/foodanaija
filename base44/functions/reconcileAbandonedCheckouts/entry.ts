import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { markOrdersPaidByReference } from "../../shared/paystackReconcile.ts";

// Scheduled safety net: scans all orders stuck in 'initiated' (abandoned) state,
// verifies each payment reference with Paystack, and marks confirmed payments as paid.
// Guarantees a real Paystack payment can never remain showing as abandoned.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const secretKey = secrets.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Find all orders still in 'initiated' state (abandoned checkouts)
    const initiatedOrders = await base44.asServiceRole.entities.Order.filter({
      payment_status: 'initiated'
    });

    if (!initiatedOrders || initiatedOrders.length === 0) {
      return Response.json({
        success: true,
        message: 'No abandoned checkouts to reconcile',
        reconciled: 0
      });
    }

    // Group by unique payment reference
    const references = [...new Set(
      initiatedOrders.map(o => o.payment_reference).filter(Boolean)
    )];

    let reconciledCount = 0;
    const details = [];

    for (const reference of references) {
      try {
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

        if (paystackData.status && paystackData.data?.status === 'success') {
          // Payment confirmed by Paystack — mark orders paid
          const updated = await markOrdersPaidByReference(base44, reference);
          reconciledCount += updated.length;
          details.push({ reference, status: 'paid', orders: updated.length });
        } else {
          details.push({ reference, status: 'not_confirmed' });
        }
      } catch (refError) {
        console.error(`Error reconciling ${reference}:`, refError);
        details.push({ reference, status: 'error', error: refError.message });
      }
    }

    return Response.json({
      success: true,
      message: `Reconciled ${reconciledCount} order(s) from ${references.length} payment reference(s)`,
      reconciled: reconciledCount,
      totalReferences: references.length,
      details
    });
  } catch (error) {
    console.error('Reconcile abandoned checkouts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}