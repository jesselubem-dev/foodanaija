import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Home, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OrderConfirmation() {
  const [user, setUser] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get reference from URL (Paystack returns 'reference' or 'trxref')
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || urlParams.get('trxref');

      if (!reference) {
        setError('Payment reference not found');
        setVerifying(false);
        return;
      }

      // Verify payment
      const response = await base44.functions.invoke('verifyPayment', { reference });
      
      if (response.data.success) {
        setOrderConfirmed(true);
        localStorage.removeItem('cart');
      } else {
        setError('Payment verification failed');
      }
    } catch (e) {
      console.error('Verification error:', e);
      setError(e.message || 'Payment verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-100">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-100">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link to={createPageUrl('CustomerHome')}>
              <Button className="bg-gradient-to-r from-red-500 to-red-600 w-full">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-emerald-100">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your order. Your payment was successful and the restaurant will start preparing your food shortly.
          </p>
          
          <Link to={createPageUrl('CustomerHome')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-full">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}