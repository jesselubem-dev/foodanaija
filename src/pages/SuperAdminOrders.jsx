import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingBag, ArrowLeft, Search, Filter, Eye, Calendar, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SuperAdminOrders() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignRider, setAssignRider] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      // Allow access if user is admin OR app creator
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: !!user,
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['all-riders'],
    queryFn: () => base44.asServiceRole.entities.Rider.filter({ status: 'active' }),
    enabled: !!user,
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      return base44.entities.Order.update(orderId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-orders']);
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    }
  });

  const assignRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderId }) => {
      const rider = riders.find(r => r.id === riderId);
      return base44.entities.Order.update(orderId, {
        rider_id: riderId,
        rider_name: rider?.full_name,
        delivery_status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-orders']);
      setAssignRider(null);
      setSelectedRiderId('');
      toast.success('Rider assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign rider: ' + error.message);
    }
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
            <p className="text-gray-500 mt-1">Platform-wide order history</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by restaurant, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">
                {orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
              <p className="text-sm text-gray-500">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-600">
                ₦{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{order.restaurant_name}</h3>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Order #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">₦{order.total?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Customer</p>
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-900">{order.delivery_address}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-gray-600">
                      Payment: {order.payment_method || 'N/A'}
                    </p>
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'accepted' })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'declined' })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {order.status === 'accepted' && !order.rider_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignRider(order)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Rider
                        </Button>
                      )}
                      {order.rider_name && (
                        <Badge className="bg-orange-100 text-orange-700">
                          Rider: {order.rider_name}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Restaurant</p>
                    <p className="font-medium">{selectedOrder.restaurant_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={statusColors[selectedOrder.status]}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedOrder.customer_phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium">{selectedOrder.delivery_address}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₦{selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>₦{selectedOrder.delivery_fee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">₦{selectedOrder.total?.toLocaleString()}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}

                {selectedOrder.rider_name && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Assigned Rider</p>
                    <p className="font-medium text-orange-900">{selectedOrder.rider_name}</p>
                    <p className="text-sm text-gray-600">
                      Status: <Badge className="bg-orange-100 text-orange-700">
                        {selectedOrder.delivery_status}
                      </Badge>
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Rider Dialog */}
        <Dialog open={!!assignRider} onOpenChange={() => setAssignRider(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Delivery Rider</DialogTitle>
            </DialogHeader>
            {assignRider && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Order Details</p>
                  <p className="font-medium">{assignRider.restaurant_name}</p>
                  <p className="text-sm text-gray-600">{assignRider.customer_name}</p>
                  <p className="text-sm text-gray-600">{assignRider.delivery_address}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Rider
                  </label>
                  <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a rider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.filter(r => r.is_online).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                            Online Now
                          </div>
                          {riders.filter(r => r.is_online).map((rider) => (
                            <SelectItem key={rider.id} value={rider.id}>
                              {rider.full_name} - {rider.phone} ✓ Online
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {riders.filter(r => !r.is_online).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                            Offline
                          </div>
                          {riders.filter(r => !r.is_online).map((rider) => (
                            <SelectItem key={rider.id} value={rider.id}>
                              {rider.full_name} - {rider.phone}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {riders.length === 0 && (
                        <div className="px-2 py-4 text-center text-sm text-gray-500">
                          No active riders available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAssignRider(null);
                      setSelectedRiderId('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-orange-600"
                    onClick={() => assignRiderMutation.mutate({
                      orderId: assignRider.id,
                      riderId: selectedRiderId
                    })}
                    disabled={!selectedRiderId || assignRiderMutation.isPending}
                  >
                    {assignRiderMutation.isPending ? 'Assigning...' : 'Assign Rider'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}