import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, X, Package, Clock, CheckCircle, XCircle, 
  Phone, Mail, MapPin, Calendar, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function SuperAdminDrinkOrders() {
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data: drinkOrders = [], isLoading } = useQuery({
    queryKey: ['drink-orders', selectedStatus],
    queryFn: async () => {
      if (selectedStatus === 'all') {
        return await base44.entities.DrinkOrder.list('-created_date');
      }
      return await base44.entities.DrinkOrder.filter({ status: selectedStatus }, '-created_date');
    },
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await base44.entities.DrinkOrder.update(orderId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drink-orders'] });
      toast.success('Order status updated');
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      declined: 'bg-red-100 text-red-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      accepted: Package,
      declined: XCircle,
      delivered: CheckCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Drink Orders</h1>
          <p className="text-gray-600">Manage customer drink orders</p>
        </div>

        {/* Status Tabs */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Grid */}
        {drinkOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No drink orders found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {drinkOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {moment(order.created_date).format('MMM DD, YYYY HH:mm')}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₦{order.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="grid md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{order.customer_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{order.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    </div>

                    {/* Drinks List */}
                    <div>
                      <h4 className="font-semibold mb-2">Drinks:</h4>
                      <div className="space-y-2">
                        {order.drinks.map((drink, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white border rounded-lg">
                            {drink.image_url && (
                              <img src={drink.image_url} alt={drink.name} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{drink.name}</p>
                              <p className="text-sm text-gray-500">₦{drink.price} x {drink.quantity}</p>
                            </div>
                            <p className="font-semibold">₦{(drink.price * drink.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Payment Status:</span>
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {order.payment_status}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'accepted' })}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Order
                        </Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'declined' })}
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {order.status === 'accepted' && (
                      <Button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}