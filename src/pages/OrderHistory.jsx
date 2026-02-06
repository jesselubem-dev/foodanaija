import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Package, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import moment from 'moment';
import CancelOrderModal from '../components/customer/CancelOrderModal';
import { LanguageProvider } from '../components/LanguageContext';

function OrderHistoryContent() {
  const [user, setUser] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [showAll, setShowAll] = useState(false);
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