import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorBoundary from '../components/ErrorBoundary';
import { EASE_NATIVE } from '@/components/ui/motion';

// Landing page after the Flutterwave Standard (redirect) checkout.
// Flutterwave redirects here with ?transaction_id=...&status=...&tx_ref=...
export default function OrderConfirmation() {
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    verify();
  }, []);

  const verify = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const transaction_id = urlParams.get('transaction_id');

      // Order snapshot saved before redirecting to Flutterwave checkout
      const pendingRaw = localStorage.getItem('pending_payment');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      const ordersData = pending?.ordersData;

      if (!transaction_id || !ordersData) {
        setStatus('failed');
        setMessage('Missing payment information. If you paid, your order will be confirmed automatically.');
        return;
      }

      const result = await base44.functions.invoke('verifyPayment', { transaction_id, ordersData });

      if (result.data?.success) {
        localStorage.removeItem('pending_payment');
        localStorage.removeItem('cart');
        setStatus('success');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          window.location.href = createPageUrl('OrderHistory');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(result.data?.message || 'Payment verification failed. If you paid, your order will be confirmed automatically.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Payment verification failed. If you paid, your order will be confirmed automatically.');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        {status === 'verifying' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full f-tint-gold flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-9 h-9 f-text-gold animate-spin" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-1">Confirming your payment…</h2>
            <p className="text-gray-500 text-sm">Please keep this page open.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="text-center max-w-sm w-full"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
              className="w-20 h-20 rounded-full bg-fooda-gold flex items-center justify-center mx-auto mb-5"
            >
              <Check className="w-10 h-10 f-on-gold" strokeWidth={3} />
            </motion.div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-1">Order placed!</h2>
            <p className="text-gray-500 text-sm mb-5">Your payment went through and your order is with the restaurant.</p>
            <div className="rounded-2xl p-4 text-left f-tint-green space-y-1">
              <p className="text-[13px] font-semibold f-text-green">✓ The restaurant will accept it shortly</p>
              <p className="text-[12px] f-text-green">We'll notify you as your order is accepted and on its way.</p>
            </div>
            <Link
              to={createPageUrl('OrderHistory')}
              className="mt-5 h-12 rounded-2xl flex items-center justify-center text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
            >
              Track my order
            </Link>
            <p className="text-[12px] text-gray-400 mt-3">Taking you to your orders…</p>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="text-center max-w-sm w-full"
          >
            <div className="w-20 h-20 rounded-full f-tint-red flex items-center justify-center mx-auto mb-5">
              <X className="w-10 h-10 f-text-red" strokeWidth={3} />
            </div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-1">Payment not confirmed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-2.5">
              <Link
                to={createPageUrl('OrderHistory')}
                className="h-12 rounded-2xl flex items-center justify-center text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
              >
                View my orders
              </Link>
              <Link
                to={createPageUrl('CustomerHome')}
                className="h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold f-btn-outline press"
              >
                <Home className="w-4 h-4" /> Back to home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  );
}
