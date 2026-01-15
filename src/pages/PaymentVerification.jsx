import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function PaymentVerification() {
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get reference from URL
      const params = new URLSearchParams(location.search);
      const reference = params.get('reference');

      if (!reference) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      // Verify payment
      const response = await base44.functions.invoke('verifyPayment', { reference });

      if (response.data.success) {
        setStatus('success');
        setMessage('Your order has been placed successfully!');
        
        // Trigger confetti
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];
        
        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());

        // Clear cart
        localStorage.removeItem('cart');

        // Redirect after delay
        setTimeout(() => {
          window.location.href = createPageUrl('OrderHistory');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
      setMessage('An error occurred. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-green-500 rounded-full animate-ping opacity-20 mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 font-medium">
                ✓ Your order has been sent to the restaurant
              </p>
              <p className="text-xs text-green-700 mt-1">
                You'll receive notifications about your order status
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = createPageUrl('OrderHistory')}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              View Order History
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = createPageUrl('Cart')}
                variant="outline"
                className="flex-1"
              >
                Back to Cart
              </Button>
              <Button 
                onClick={() => window.location.href = createPageUrl('CustomerHome')}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Go Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}