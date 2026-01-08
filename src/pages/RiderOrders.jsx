import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, MapPin, Phone, User, ArrowLeft, Store, Navigation,
  CheckCircle2, Clock, Truck
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
import { toast } from 'sonner';

export default function RiderOrders() {
  const [rider, setRider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      if (!user.rider_id) {
        window.location.href = createPageUrl('RiderLogin');
        return;
      }
      
      // Fetch rider data
      const riderData = await base44.asServiceRole.entities.Rider.filter({ id: user.rider_id });
      if (riderData.length === 0) {
        window.location.href = createPageUrl('RiderLogin');
        return;
      }
      
      setRider(riderData[0]);
    } catch (e) {
      window.location.href = createPageUrl('RiderLogin');
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['rider-orders', rider?.id],
    queryFn: async () => {
      const allOrders = await base44.asServiceRole.entities.Order.list('-created_date');
      return allOrders.filter(order => order.rider_id === rider?.id);
    },
    enabled: !!rider,
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }) => {
      const response = await base44.functions.invoke('updateDeliveryStatus', {
        order_id: orderId,
        delivery_status: newStatus,
        rider_id: rider.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rider-orders']);
      setSelectedOrder(null);
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-yellow-100 text-yellow-700',
      on_the_way: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      assigned: 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    };
    return flow[currentStatus];
  };

  const getStatusLabel = (status) => {
    const labels = {
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      on_the_way: 'On The Way',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered');
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');

  if (!rider) {
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
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('RiderDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-500">{activeOrders.length} active orders</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : activeOrders.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No active orders</h3>
                <p className="text-gray-500">New orders will appear here when assigned to you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
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
                      <Badge className={getStatusColor(order.delivery_status)}>
                        {getStatusLabel(order.delivery_status)}
                      </Badge>
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
                        {getNextStatus(order.delivery_status) && (
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => updateStatusMutation.mutate({
                              orderId: order.id,
                              newStatus: getNextStatus(order.delivery_status)
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            {getNextStatus(order.delivery_status) === 'picked_up' && 'Pick Up'}
                            {getNextStatus(order.delivery_status) === 'on_the_way' && 'On The Way'}
                            {getNextStatus(order.delivery_status) === 'delivered' && 'Delivered'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Deliveries</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map((order) => (
                <Card key={order.id} className="border-green-100 bg-green-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">{order.restaurant_name}</CardTitle>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Delivered
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{order.customer_name}</span>
                      <span className="text-lg font-bold text-green-600">
                        ₦{order.total?.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status */}
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Delivery Status</h3>
                  <Badge className={getStatusColor(selectedOrder.delivery_status)}>
                    {getStatusLabel(selectedOrder.delivery_status)}
                  </Badge>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
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
                    <a href={`tel:${selectedOrder.customer_phone}`} className="text-orange-600 hover:underline">
                      {selectedOrder.customer_phone}
                    </a>
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

              {/* Payment Info */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">{selectedOrder.payment_method?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <Badge className={selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span className="text-orange-600">₦{selectedOrder.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Notes */}
              {selectedOrder.notes && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {getNextStatus(selectedOrder.delivery_status) && (
                <div className="flex gap-2">
                  {selectedOrder.delivery_address && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.delivery_address)}`)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>
                  )}
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 h-12"
                    onClick={() => updateStatusMutation.mutate({
                      orderId: selectedOrder.id,
                      newStatus: getNextStatus(selectedOrder.delivery_status)
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {getNextStatus(selectedOrder.delivery_status) === 'picked_up' && (
                      <>
                        <Package className="w-5 h-5 mr-2" />
                        Mark as Picked Up
                      </>
                    )}
                    {getNextStatus(selectedOrder.delivery_status) === 'on_the_way' && (
                      <>
                        <Truck className="w-5 h-5 mr-2" />
                        Mark as On The Way
                      </>
                    )}
                    {getNextStatus(selectedOrder.delivery_status) === 'delivered' && (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Mark as Delivered
                      </>
                    )}
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