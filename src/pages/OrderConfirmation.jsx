import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your payment…</h2>
            <p className="text-gray-500 text-sm">Please don't close this page.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
            <p className="text-gray-600 mb-4">Your order has been successfully sent to the restaurant.</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <p className="text-sm text-orange-800 font-medium">✓ Restaurant will review your order shortly</p>
              <p className="text-xs text-orange-700 mt-1">You'll receive notifications about your order status</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">Redirecting to your orders…</p>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-red-500" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment not confirmed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link to={createPageUrl('OrderHistory')}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">View My Orders</Button>
              </Link>
              <Link to={createPageUrl('CustomerHome')}>
                <Button variant="outline" className="w-full"><Home className="w-4 h-4 mr-2" />Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  );
}