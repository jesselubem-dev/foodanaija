import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Bike, LogOut, CheckCircle, TrendingUp, Clock, MapPin, 
  Phone, User, DollarSign, Target, Calendar, ArrowRight, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

export default function RiderDashboard() {
  const [rider, setRider] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const riderAuth = localStorage.getItem('rider_auth');
    if (!riderAuth) {
      window.location.href = createPageUrl('RiderLogin');
      return;
    }
    
    try {
      const riderData = JSON.parse(riderAuth);
      setRider(riderData);
    } catch (e) {
      window.location.href = createPageUrl('RiderLogin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_auth');
    window.location.href = createPageUrl('RiderLogin');
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
  
  // Today's stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_date).toDateString() === today);
  const todayCompleted = todayOrders.filter(o => o.delivery_status === 'delivered');
  const todayEarnings = todayCompleted.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // This week's stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = orders.filter(o => new Date(o.created_date) >= weekAgo && o.delivery_status === 'delivered');
  const weekEarnings = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // All time
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!rider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
    }

    return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="text-sm text-gray-500">{rider.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${rider.is_online ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                <span className="text-sm font-medium text-gray-700">
                  {rider.is_online ? 'Online' : 'Offline'}
                </span>
                <Switch
                  checked={rider.is_online}
                  onCheckedChange={(checked) => toggleOnlineMutation.mutate(checked)}
                />
              </div>
              <Button variant="outline" onClick={handleLogout} className="rounded-xl">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <Calendar className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-3xl font-bold mb-1">₦{todayEarnings.toLocaleString()}</p>
              <p className="text-sm opacity-80">Today's Earnings</p>
              <p className="text-xs opacity-60 mt-1">{todayCompleted.length} deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">₦{weekEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-xs text-gray-400 mt-1">{weekOrders.length} deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{rider.total_deliveries || 0}</p>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-xs text-gray-400 mt-1">₦{totalEarnings.toLocaleString()} earned</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{assignedOrders.length}</p>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="text-xs text-gray-400 mt-1">{activeDelivery ? '1 in progress' : 'No active delivery'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Active Deliveries</h2>
              <p className="text-sm text-gray-500">Orders waiting for pickup or delivery</p>
            </div>
            <Link to={createPageUrl('RiderOrders')}>
              <Button variant="outline" className="rounded-xl">
                View All Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {assignedOrders.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-orange-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Orders</h3>
                <p className="text-gray-500">
                  {rider.is_online ? 'New deliveries will appear here when assigned' : 'Go online to receive delivery requests'}
                </p>
                {!rider.is_online && (
                  <Button 
                    onClick={() => toggleOnlineMutation.mutate(true)}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl"
                  >
                    Go Online
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {assignedOrders.map((order) => (
                <Card key={order.id} className="border-orange-100 hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{order.restaurant_name}</CardTitle>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        order.delivery_status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        order.delivery_status === 'picked_up' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }>
                        {order.delivery_status === 'assigned' ? 'New' :
                         order.delivery_status === 'picked_up' ? 'Picked Up' : 'On The Way'}
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

                    <div className="pt-3 border-t flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Order Total</p>
                        <p className="text-xl font-bold text-orange-600">₦{order.total?.toLocaleString()}</p>
                      </div>
                      <Link to={createPageUrl('RiderOrders')}>
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed Deliveries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Completions</h2>
              <p className="text-sm text-gray-500">Your latest delivered orders</p>
            </div>
          </div>

          {completedOrders.length === 0 ? (
            <Card className="border-green-100 bg-green-50/30">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">No completed deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {completedOrders.slice(0, 6).map((order) => (
                <Card key={order.id} className="border-green-100 bg-green-50/30 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{order.restaurant_name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(order.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-green-200">
                      <span className="text-xs text-gray-600">{order.customer_name}</span>
                      <span className="text-lg font-bold text-green-600">₦{order.total?.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    );
}