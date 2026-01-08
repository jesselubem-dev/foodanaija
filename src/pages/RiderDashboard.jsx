import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Bike, LogOut, CheckCircle, TrendingUp, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function RiderDashboard() {
  const [rider, setRider] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const riderAuth = localStorage.getItem('rider_auth');
    if (!riderAuth) {
      window.location.href = '/RiderLogin';
      return;
    }
    
    try {
      const riderData = JSON.parse(riderAuth);
      setRider(riderData);
    } catch (e) {
      window.location.href = '/RiderLogin';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_auth');
    window.location.href = '/RiderLogin';
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['rider-orders', rider?.id],
    queryFn: async () => {
      const allOrders = await base44.asServiceRole.entities.Order.list('-created_date');
      return allOrders.filter(order => order.rider_id === rider?.id);
    },
    enabled: !!rider,
    refetchInterval: 5000,
  });

  const toggleOnlineMutation = useMutation({
    mutationFn: (isOnline) => base44.asServiceRole.entities.Rider.update(rider.id, { is_online: isOnline }),
    onSuccess: (_, isOnline) => {
      const updatedRider = { ...rider, is_online: isOnline };
      setRider(updatedRider);
      localStorage.setItem('rider_auth', JSON.stringify(updatedRider));
      queryClient.invalidateQueries(['rider-orders']);
    },
  });

  const assignedOrders = orders.filter(o => 
    o.delivery_status !== 'delivered' && o.status === 'accepted'
  );
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');
  const activeDelivery = orders.find(o => 
    o.delivery_status === 'picked_up' || o.delivery_status === 'on_the_way'
  );

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rider Dashboard</h1>
                <p className="text-sm text-gray-500">{rider.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {rider.is_online ? 'Online' : 'Offline'}
                </span>
                <Switch
                  checked={rider.is_online}
                  onCheckedChange={(checked) => toggleOnlineMutation.mutate(checked)}
                />
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{assignedOrders.length}</p>
                  <p className="text-sm text-gray-500">Assigned Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{activeDelivery ? 1 : 0}</p>
                  <p className="text-sm text-gray-500">Active Delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{completedOrders.length}</p>
                  <p className="text-sm text-gray-500">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{rider.total_deliveries || 0}</p>
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to={createPageUrl('RiderOrders')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  View My Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Access all orders assigned to you and update delivery status
                </p>
                <Badge className="bg-orange-100 text-orange-700">
                  {assignedOrders.length} Pending
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-blue-600" />
                Rider Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{rider.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{rider.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <Badge className={rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {rider.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}