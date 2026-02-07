import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Package, RotateCcw, Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import moment from 'moment';
import confetti from 'canvas-confetti';
import CancelOrderModal from '../components/customer/CancelOrderModal';
import { LanguageProvider } from '../components/LanguageContext';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

function OrderHistoryContent() {
  const [user, setUser] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not logged in, Layout will handle redirect
      }
    };
    loadUser();

    // Check for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowSuccess(true);
      
      // Remove success param from URL
      window.history.replaceState({}, '', createPageUrl('OrderHistory'));
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: async () => {
      const results = await base44.entities.Order.filter({ customer_email: user.email }, '-created_date');
      return results;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      await base44.entities.Order.update(orderId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders', user?.email] });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  const handleReorder = (order) => {
    const cart = order.items.map(item => ({
      item_id: item.item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      restaurant_id: order.restaurant_id,
      restaurant_name: order.restaurant_name
    }));

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`${order.items.length} items added to cart`);
    window.location.href = createPageUrl('Cart');
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    accepted: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Accepted' },
    declined: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Declined' },
    preparing: { icon: Package, color: 'bg-purple-100 text-purple-700', label: 'Preparing' },
    ready: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Ready' },
    delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 pb-20">
        {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order History</h1>
              <p className="text-sm text-gray-500">{orders.length} orders</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">Start ordering from your favorite restaurants</p>
              <Link to={createPageUrl('CustomerHome')}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                  Browse Restaurants
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(showAll ? orders : orders.slice(0, 3)).map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <Card key={order.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{order.restaurant_name}</h3>
                        <p className="text-sm text-gray-500">
                          {moment(order.created_date).format('MMM DD, YYYY • h:mm A')}
                        </p>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Delivery Progress Bar */}
                    {order.status === 'accepted' && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">Delivery Progress</p>
                          <p className="text-xs text-gray-500">
                            {order.delivery_status === 'unassigned' && 'Waiting for rider'}
                            {order.delivery_status === 'assigned' && 'Rider assigned'}
                            {order.delivery_status === 'picked_up' && 'Order picked up'}
                            {order.delivery_status === 'on_the_way' && 'On the way'}
                            {order.delivery_status === 'delivered' && 'Delivered'}
                          </p>
                        </div>
                        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-visible">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{
                              width: 
                                order.delivery_status === 'unassigned' ? '0%' :
                                order.delivery_status === 'assigned' ? '25%' :
                                order.delivery_status === 'picked_up' ? '50%' :
                                order.delivery_status === 'on_the_way' ? '75%' :
                                order.delivery_status === 'delivered' ? '100%' : '0%'
                            }}
                          />
                          {order.delivery_status !== 'unassigned' && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
                              style={{
                                left: 
                                  order.delivery_status === 'assigned' ? '25%' :
                                  order.delivery_status === 'picked_up' ? '50%' :
                                  order.delivery_status === 'on_the_way' ? '75%' :
                                  order.delivery_status === 'delivered' ? '100%' : '0%'
                              }}
                            >
                              <div className="bg-white rounded-full p-1 shadow-lg">
                                <Bike className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span className={order.delivery_status !== 'unassigned' ? 'text-blue-600 font-medium' : ''}>Assigned</span>
                          <span className={['picked_up', 'on_the_way', 'delivered'].includes(order.delivery_status) ? 'text-blue-600 font-medium' : ''}>Picked Up</span>
                          <span className={['on_the_way', 'delivered'].includes(order.delivery_status) ? 'text-blue-600 font-medium' : ''}>On the Way</span>
                          <span className={order.delivery_status === 'delivered' ? 'text-blue-600 font-medium' : ''}>Delivered</span>
                        </div>
                        {order.rider_name && (
                          <p className="text-xs text-gray-600 mt-2">
                            Rider: <span className="font-medium">{order.rider_name}</span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="border-t pt-4 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold text-orange-600">
                          ₦{order.total?.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => setCancelOrderId(order.id)}
                            variant="outline"
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                            disabled={cancelOrderMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={() => handleReorder(order)}
                          variant="outline"
                        >
                          Reorder
                        </Button>
                      </div>
                    </div>

                    {order.delivery_address && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-500">Delivery Address</p>
                        <p className="text-sm text-gray-700">{order.delivery_address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {/* View All Button */}
            {orders.length > 3 && !showAll && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setShowAll(true)}
                  variant="outline"
                  className="gap-2"
                >
                  View All Orders ({orders.length})
                </Button>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Cancel Order Modal */}
        <CancelOrderModal
          isOpen={!!cancelOrderId}
          order={orders.find(o => o.id === cancelOrderId)}
          onConfirm={(orderId) => {
            cancelOrderMutation.mutate(orderId);
            setCancelOrderId(null);
          }}
          onCancel={() => setCancelOrderId(null)}
          isLoading={cancelOrderMutation.isPending}
        />

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="max-w-sm">
            <div className="text-center py-6">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
              <p className="text-gray-600 mb-4">
                Your order has been successfully sent to the restaurant
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium">
                  ✓ Restaurant will review your order shortly
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  You'll receive notifications about your order status
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}

export default function OrderHistory() {
  return (
    <LanguageProvider>
      <OrderHistoryContent />
    </LanguageProvider>
  );
}