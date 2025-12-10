import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-emerald-100">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-8">
            Your order has been received and is being prepared. You'll receive updates on your order status.
          </p>

          <Link to={createPageUrl('CustomerHome')}>
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 h-12">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}