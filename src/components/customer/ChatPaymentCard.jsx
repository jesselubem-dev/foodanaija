import React, { useState } from 'react';
import { CreditCard, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

export default function ChatPaymentCard({ orderData, onPaymentSuccess, onCancel }) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simulate payment processing for cash on delivery
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create orders for each restaurant
      const orders = await Promise.all(
        orderData.map(order => base44.entities.Order.create(order))
      );

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccess(true);
      
      setTimeout(() => {
        onPaymentSuccess(orders);
      }, 1500);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const totalAmount = orderData.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orderData.reduce((sum, order) => sum + order.items.length, 0);
  const restaurantCount = orderData.length;

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-6 my-4 animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h3>
          <p className="text-sm text-gray-600">Your order has been sent to the restaurant</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="my-4 border-2 border-orange-200 shadow-xl bg-gradient-to-br from-orange-50 to-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Confirm Your Order</h3>
            <p className="text-sm text-gray-600">
              {restaurantCount} {restaurantCount > 1 ? 'restaurants' : 'restaurant'} • {totalItems} items
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-orange-100 space-y-2">
          {orderData.map((order, index) => (
            <div key={index} className="pb-2 border-b last:border-b-0 last:pb-0">
              <p className="font-semibold text-gray-900">{order.restaurant_name}</p>
              {order.items.slice(0, 2).map((item, idx) => (
                <p key={idx} className="text-sm text-gray-600">
                  {item.quantity}x {item.name}
                </p>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>
              )}
              <p className="text-sm font-medium text-gray-700 mt-1">₦{order.total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-orange-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-orange-600">₦{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Cash on Delivery</p>
              <p className="text-xs text-green-700">Pay when your order arrives</p>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Deliver to:</strong> {orderData[0].delivery_address}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-gray-300"
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Order
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}