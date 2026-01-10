import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Phone, User, Package, CheckCircle, Navigation, Clock
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
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
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
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!order?.accepted_at) return;

    const calculateTimeRemaining = () => {
      const acceptedTime = new Date(order.accepted_at).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - acceptedTime) / 1000);
      const remaining = Math.max(0, 1200 - elapsed); // 20 mins = 1200 seconds
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [order?.accepted_at]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-blue-100 shadow-lg sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.location.href = createPageUrl('RiderDashboard')}
              className="rounded-xl hover:bg-blue-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
            <Badge className={`${currentStatus.color} text-white px-4 py-2 text-sm font-semibold`}>
              {currentStatus.label}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Timer Card */}
        {(order.delivery_status !== 'delivered') && (
          <Card className={`border-2 ${timeRemaining < 300 ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${timeRemaining < 300 ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center`}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Delivery Timer</p>
                    <p className="text-xs text-gray-500">Target: 20 minutes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeRemaining)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {timeRemaining === 0 ? 'Time exceeded!' : 'remaining'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
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
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
            <div className="max-w-3xl mx-auto">
              <Button
                onClick={() => handleStatusUpdate(currentStatus.next)}
                disabled={updateStatusMutation.isPending}
                className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg font-bold rounded-2xl shadow-2xl"
              >
                {updateStatusMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-2" />
                    {currentStatus.nextLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Bottom padding for fixed button or delivered state */}
        {currentStatus.next || order.delivery_status === 'delivered' ? <div className="h-24" /> : null}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Delivery Complete! 🎉</h2>
            <p className="text-gray-600 text-lg">Excellent work! Returning to dashboard...</p>
            <div className="mt-4 inline-flex items-center gap-2 text-green-600 font-semibold">
              <span className="text-2xl">+₦{order.delivery_fee || 500}</span>
              <span className="text-sm">earned</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}