import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Package, Clock, CheckCircle, XCircle, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusFlow = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending', next: 'accepted' },
  accepted: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package, label: 'Accepted', next: 'preparing' },
  preparing: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package, label: 'Preparing', next: 'ready' },
  ready: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package, label: 'Ready for Delivery', next: 'delivered' },
  delivered: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Delivered', next: null },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled', next: null }
};

export default function DashboardOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length === 0) {
        navigate(createPageUrl('RestaurantSetup'));
        return;
      }
      
      setRestaurant(restaurants[0]);
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['restaurantOrders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return await base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date');
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
      toast.success('Order status updated');
    }
  });

  const updateOrderStatus = (orderId, newStatus) => {
    updateOrderMutation.mutate({ id: orderId, data: { status: newStatus } });
  };

  const filterOrders = (status) => {
    if (status === 'all') return orders;
    if (status === 'active') {
      return orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
    }
    return orders.filter(o => o.status === status);
  };

  if (!restaurant) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const activeCount = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track your restaurant orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="delivered">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filterOrders(activeTab).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-emerald-50">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No {activeTab !== 'all' ? activeTab : ''} orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filterOrders(activeTab).map(order => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;

              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(order.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Badge className={`${config.color} border flex items-center gap-1.5`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Customer Info */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{order.delivery_address}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span className="text-emerald-600">₦{order.total?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="mb-4">
                      <span className="text-xs text-gray-500">Payment: </span>
                      <Badge variant="outline" className="capitalize">{order.payment_method}</Badge>
                      <Badge className={`ml-2 ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.payment_status}
                      </Badge>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-amber-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-500 mb-1">Special Instructions:</p>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {config.next && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, config.next)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        Mark as {statusConfig[config.next].label}
                      </Button>
                    )}

                    {order.status === 'pending' && (
                      <Button
                        onClick={() => {
                          if (confirm('Cancel this order?')) {
                            updateOrderStatus(order.id, 'cancelled');
                          }
                        }}
                        variant="outline"
                        className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Tabs>
    </div>
  );
}