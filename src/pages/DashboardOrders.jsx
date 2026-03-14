import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { 
  Clock, CheckCircle, Package, Truck, XCircle,
  Phone, MapPin, User, ChevronDown, RefreshCw, Search, History, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createPageUrl } from '../utils';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
};

export default function DashboardOrders() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      } else {
        window.location.href = createPageUrl('RestaurantSetup');
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['restaurant-orders', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, customerEmail }) => {
      await base44.entities.Order.update(id, { status });
      
      // Create notification for customer
      if (status === 'accepted') {
        await base44.entities.Notification.create({
          user_email: customerEmail,
          title: 'Order Accepted! 🎉',
          message: 'Good news! Your order has been accepted by the restaurant and will be prepared shortly.',
          type: 'order_accepted',
          order_id: id,
        });

        // Automatically assign rider to accepted order
        try {
          const result = await base44.functions.invoke('assignRiderToOrder', { orderId: id });
          if (result.data.success) {
            toast.success('Rider assigned successfully');
          }
        } catch (error) {
          console.error('Failed to assign rider:', error);
        }
      } else if (status === 'declined') {
        await base44.entities.Notification.create({
          user_email: customerEmail,
          title: 'Order Declined',
          message: 'Sorry, the restaurant is unable to fulfill your order at this time.',
          type: 'order_declined',
          order_id: id,
        });
      }
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['restaurant-orders', restaurant?.id] });
      
      const previousOrders = queryClient.getQueryData(['restaurant-orders', restaurant?.id]);
      
      queryClient.setQueryData(['restaurant-orders', restaurant?.id], (old) =>
        old?.map((order) => order.id === id ? { ...order, status } : order)
      );
      
      return { previousOrders };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['restaurant-orders', restaurant?.id], context.previousOrders);
      toast.error('Failed to update order status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant-orders']);
      toast.success('Order status updated');
    },
  });

  const activeOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => ['accepted', 'declined'].includes(o.status));

  const filteredOrders = (activeTab === 'active' ? activeOrders : completedOrders).filter(order =>
    !searchQuery || 
    order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage incoming orders</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} className="border-emerald-200">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          label="Pending" 
          count={orders.filter(o => o.status === 'pending').length}
          color="amber"
        />
        <StatCard 
          label="Accepted" 
          count={orders.filter(o => o.status === 'accepted').length}
          color="green"
        />
        <StatCard 
          label="Declined" 
          count={orders.filter(o => o.status === 'declined').length}
          color="red"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-100 rounded-xl p-1">
          <TabsTrigger 
            value="active" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-emerald-50">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders</h3>
          <p className="text-gray-500 text-sm">
            {activeTab === 'active' ? 'No active orders at the moment' : 'No completed orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order}
              onViewDetails={() => setSelectedOrder(order)}
              onUpdateStatus={(status) => updateStatusMutation.mutate({ id: order.id, status })}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={`${statusConfig[selectedOrder.status]?.color} border`}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  {selectedOrder.created_date && format(new Date(selectedOrder.created_date), 'MMM d, h:mm a')}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedOrder.customer_name || 'Customer'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${selectedOrder.customer_phone}`} className="text-emerald-600">
                    {selectedOrder.customer_phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{selectedOrder.delivery_address}</span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50'} 
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">x{item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-xl">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₦{selectedOrder.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>₦{selectedOrder.delivery_fee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">₦{selectedOrder.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <Badge variant="outline" className="capitalize">{selectedOrder.payment_method}</Badge>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateStatusMutation.mutate({ 
                        id: selectedOrder.id, 
                        status: 'declined',
                        customerEmail: selectedOrder.customer_email 
                      });
                      setSelectedOrder(null);
                    }}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Decline Order
                  </Button>
                  <Button 
                    onClick={() => {
                      updateStatusMutation.mutate({ 
                        id: selectedOrder.id, 
                        status: 'accepted',
                        customerEmail: selectedOrder.customer_email
                      });
                      setSelectedOrder(null);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    Accept Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, count, color }) {
  const colors = {
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-emerald-50">
      <div className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{count}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function OrderCard({ order, onViewDetails, onUpdateStatus, isUpdating }) {
  const status = statusConfig[order.status];
  const StatusIcon = status?.icon || Clock;

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(newStatus, order.customer_email);
  };

  return (
    <Card className="border-emerald-50 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${status?.color} border gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {status?.label}
              </Badge>
              <span className="text-sm text-gray-500">
                {order.created_date && format(new Date(order.created_date), 'h:mm a')}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900">{order.customer_name || 'Customer'}</h4>
            <p className="text-sm text-gray-500">
              {order.items?.length} items • ₦{order.total?.toLocaleString()}
            </p>
          </div>

          {/* Items Preview */}
          <div className="flex -space-x-2">
            {order.items?.slice(0, 3).map((item, idx) => (
              <img 
                key={idx}
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50'} 
                alt=""
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            ))}
            {(order.items?.length || 0) > 3 && (
              <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            {order.status === 'pending' && (
              <>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={isUpdating}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Decline
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={isUpdating}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Accept
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}