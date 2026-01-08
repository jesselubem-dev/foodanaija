import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Phone, User, Package, CheckCircle, Navigation
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

export default function RiderDelivery() {
  const [rider, setRider] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  useEffect(() => {
    checkRider();
  }, []);

  const checkRider = async () => {
    try {
      const userData = await base44.auth.me();
      const riders = await base44.entities.Rider.filter({ email: userData.email });
      if (riders.length === 0) {
        window.location.href = createPageUrl('RiderHome');
        return;
      }
      setRider(riders[0]);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.filter({ id: orderId }).then(r => r[0]),
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const updates = { delivery_status: newStatus };
      
      if (newStatus === 'delivered') {
        updates.status = 'delivered';
        await base44.entities.Rider.update(rider.id, {
          total_deliveries: (rider.total_deliveries || 0) + 1
        });
      }
      
      return base44.entities.Order.update(orderId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      queryClient.invalidateQueries(['rider-orders']);
      if (order.delivery_status === 'on_the_way') {
        setShowSuccess(true);
        setTimeout(() => {
          window.location.href = createPageUrl('RiderDashboard');
        }, 2000);
      }
    },
  });

  const handleStatusUpdate = (status) => {
    updateStatusMutation.mutate(status);
  };

  const openMaps = () => {
    const address = encodeURIComponent(order.delivery_address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusConfig = {
    assigned: { label: 'New Assignment', color: 'bg-blue-500', next: 'picked_up', nextLabel: 'Mark as Picked Up' },
    picked_up: { label: 'Picked Up', color: 'bg-orange-500', next: 'on_the_way', nextLabel: 'Start Delivery' },
    on_the_way: { label: 'On The Way', color: 'bg-purple-500', next: 'delivered', nextLabel: 'Mark as Delivered' },
    delivered: { label: 'Delivered', color: 'bg-green-500', next: null, nextLabel: null },
  };

  const currentStatus = statusConfig[order.delivery_status] || statusConfig.assigned;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Badge className={`${currentStatus.color} text-white`}>
              {currentStatus.label}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Customer Info */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Name</span>
              <span className="font-medium text-gray-900">{order.customer_name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Phone</span>
              <a href={`tel:${order.customer_phone}`} className="font-medium text-blue-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {order.customer_phone}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 mb-4">{order.delivery_address}</p>
            <Button
              onClick={openMaps}
              className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-gray-900 text-lg">{order.restaurant_name}</p>
            <p className="text-sm text-gray-600 mt-1">{order.items?.length} items to deliver</p>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">₦{order.total?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {currentStatus.next && (
          <Button
            onClick={() => handleStatusUpdate(currentStatus.next)}
            disabled={updateStatusMutation.isPending}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg rounded-2xl shadow-lg"
          >
            {updateStatusMutation.isPending ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                {currentStatus.nextLabel}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Complete!</h2>
            <p className="text-gray-600">Great job! Moving to next delivery...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}