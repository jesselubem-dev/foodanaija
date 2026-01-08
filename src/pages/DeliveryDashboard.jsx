import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, MapPin, Phone, User, CheckCircle, Clock, Store,
  Navigation, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

export default function DeliveryDashboard() {
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const deliveryAuth = localStorage.getItem('delivery_auth');
    if (!deliveryAuth) {
      window.location.href = '/DeliveryLogin';
      return;
    }
    
    try {
      const authData = JSON.parse(deliveryAuth);
      setUser({ 
        email: authData.email, 
        full_name: authData.name 
      });
    } catch (e) {
      window.location.href = '/DeliveryLogin';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_auth');
    window.location.href = '/DeliveryLogin';
  };

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['delivery-orders'],
    queryFn: async () => {
      const orders = await base44.entities.Order.list('-created_date');
      return orders.filter(order => 
        order.delivery_address && 
        order.status !== 'declined' && 
        order.status !== 'cancelled'
      );
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const orders = allOrders.filter(o => o.status === 'accepted');

  const { data: restaurants = [] } = useQuery({
    queryKey: ['delivery-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user,
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { status: 'delivered' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-orders']);
      setSelectedOrder(null);
    },
  });

  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant?.name || 'Unknown Restaurant';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Delivery Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.full_name || 'Delivery Rider'}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  <p className="text-xs text-gray-500">Pending Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders Ready for Delivery</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders to deliver</h3>
                <p className="text-gray-500">Check back soon for new deliveries</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-orange-600" />
                        <div>
                          <CardTitle className="text-lg">{order.restaurant_name}</CardTitle>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="text-lg font-bold text-orange-600">
                          ₦{order.total?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => markAsDeliveredMutation.mutate(order.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Delivered
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Restaurant Info */}
              <div className="p-4 bg-orange-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Restaurant</h3>
                <p className="text-sm text-gray-700">{selectedOrder.restaurant_name}</p>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₦{selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>₦{selectedOrder.delivery_fee?.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-600">₦{selectedOrder.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Payment: {selectedOrder.payment_method?.toUpperCase()} 
                  {selectedOrder.payment_status === 'paid' ? ' (Paid)' : ' (Not Paid)'}
                </span>
              </div>

              {/* Special Notes */}
              {selectedOrder.notes && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full bg-green-600 hover:bg-green-700 h-12"
                onClick={() => markAsDeliveredMutation.mutate(selectedOrder.id)}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Mark as Delivered
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}