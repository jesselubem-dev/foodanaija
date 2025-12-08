import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Package, CheckCircle, X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  accepted: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package, label: 'Accepted' },
  preparing: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package, label: 'Preparing' },
  ready: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package, label: 'Ready' },
  delivered: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: X, label: 'Cancelled' }
};

export default function Orders() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      // Not logged in
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const userOrders = await base44.entities.Order.filter({ 
        customer_email: user.email 
      }, '-created_date');
      return userOrders;
    },
    enabled: !!user?.email
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <Package className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view orders</h2>
        <p className="text-gray-500 mb-6">Please sign in to see your order history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-emerald-50">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <Package className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start ordering from your favorite restaurants</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-emerald-50 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{order.restaurant_name}</h3>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <Badge className={`${status.color} border flex items-center gap-1.5`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </Badge>
              </div>

              {/* Order Details */}
              <div className="p-4">
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                {order.delivery_address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{order.delivery_address}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span>Payment: </span>
                    <span className="font-medium text-gray-700 capitalize">{order.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-emerald-600">₦{order.total?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}