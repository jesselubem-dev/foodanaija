import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Bike, Package, Clock, CheckCircle, MapPin, Star, Phone, User, Navigation, LogOut, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RiderDashboard() {
  const [user, setUser] = useState(null);
  const [rider, setRider] = useState(null);

  useEffect(() => {
    checkRider();
  }, []);

  const checkRider = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        console.log('Not authenticated, redirecting to login');
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const userData = await base44.auth.me();
      console.log('User data:', userData);
      setUser(userData);
      
      // Check if user is a registered rider
      const riders = await base44.entities.Rider.filter({ email: userData.email });
      console.log('Found riders:', riders);
      
      if (riders.length === 0) {
        console.log('Not a registered rider, redirecting to RiderHome');
        window.location.href = createPageUrl('RiderHome');
        return;
      }
      
      console.log('Rider found:', riders[0]);
      setRider(riders[0]);
    } catch (e) {
      console.error('Rider check failed:', e);
      // Only redirect to login if it's an auth error, not other errors
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
      }
    }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'accepted' }),
    enabled: !!rider,
    refetchInterval: 5000,
  });

  const toggleAvailability = async () => {
    await base44.entities.Rider.update(rider.id, {
      is_available: !rider.is_available
    });
    setRider({ ...rider, is_available: !rider.is_available });
  };

  const myActiveOrders = rider ? orders.filter(o => o.rider_id === rider.id && ['picked_up', 'on_the_way'].includes(o.delivery_status)) : [];
  const myCompletedOrders = rider ? orders.filter(o => o.rider_id === rider.id && o.delivery_status === 'delivered') : [];
  const unassignedOrders = orders.filter(o => o.delivery_status === 'unassigned');
  const assignedToOthers = rider ? orders.filter(o => o.delivery_status === 'assigned' && o.rider_id && o.rider_id !== rider.id) : [];
  const todayEarnings = myCompletedOrders
    .filter(o => {
      const orderDate = new Date(o.created_date);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, o) => sum + (o.delivery_fee || 500), 0);

  if (!rider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const todayCompleted = myCompletedOrders.filter(o => {
    const orderDate = new Date(o.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-blue-100 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Rider Dashboard
                </h1>
                <p className="text-sm text-gray-600 font-medium">{rider.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                rider.is_available 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-gray-100 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${rider.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {rider.is_available ? 'Available' : 'Offline'}
                </span>
                <Switch
                  checked={rider.is_available}
                  onCheckedChange={toggleAvailability}
                />
              </div>
              <Button
                onClick={() => base44.auth.logout()}
                variant="outline"
                className="rounded-xl border-2 hover:bg-red-50 hover:border-red-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Package}
            title="Available Orders"
            value={unassignedOrders.length}
            subtitle="Ready to pick"
            color="blue"
          />
          <StatCard
            icon={Navigation}
            title="Active Deliveries"
            value={myActiveOrders.length}
            subtitle="In progress"
            color="orange"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed Today"
            value={todayCompleted.length}
            subtitle="Deliveries done"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Today's Earnings"
            value={`₦${todayEarnings.toLocaleString()}`}
            subtitle={`₦${rider.total_deliveries ? Math.round(todayEarnings / (todayCompleted.length || 1)) : 0}/order`}
            color="purple"
          />
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Navigation className="w-4 h-4 mr-2" />
              Active ({myActiveOrders.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Available ({unassignedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({todayCompleted.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Deliveries Tab */}
          <TabsContent value="active">
            {myActiveOrders.length === 0 ? (
              <Card className="border-orange-100">
                <CardContent className="text-center py-12">
                  <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-500">Accept an order to start delivering</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myActiveOrders.map((order) => (
                  <Card key={order.id} className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-500 text-white px-3 py-1">
                              {order.delivery_status === 'picked_up' ? '📦 Picked Up' : '🚴 On The Way'}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{order.restaurant_name}</h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {order.customer_name} • {order.customer_phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{order.items?.length} items</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 mb-4 border border-orange-100">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{order.delivery_address}</span>
                        </div>
                      </div>
                      <Link to={createPageUrl(`RiderDelivery?id=${order.id}`)}>
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl h-12">
                          <Navigation className="w-4 h-4 mr-2" />
                          Continue Delivery
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available Orders Tab */}
          <TabsContent value="available">
            {unassignedOrders.length === 0 ? (
              <Card className="border-blue-100">
                <CardContent className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Available Orders</h3>
                  <p className="text-gray-500">Check back soon for new deliveries</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unassignedOrders.map((order) => (
                  <Card key={order.id} className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Badge className="bg-blue-500 text-white px-3 py-1 mb-2">🆕 New Order</Badge>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{order.restaurant_name}</h3>
                          <div className="space-y-1">
                            <p className="text-gray-600 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {order.customer_name}
                            </p>
                            <p className="text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {order.customer_phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">₦{order.total?.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{order.items?.length} items</p>
                          <p className="text-xs text-green-600 font-medium mt-1">+₦{order.delivery_fee || 500} fee</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 mb-4 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{order.delivery_address}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl h-12 font-semibold"
                        onClick={async (e) => {
                          e.preventDefault();
                          await base44.entities.Order.update(order.id, {
                            rider_id: rider.id,
                            rider_name: rider.full_name,
                            delivery_status: 'assigned'
                          });
                          window.location.href = createPageUrl(`RiderDelivery?id=${order.id}`);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept & Start Delivery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Orders Tab */}
          <TabsContent value="completed">
            {todayCompleted.length === 0 ? (
              <Card className="border-green-100">
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Completed Deliveries Today</h3>
                  <p className="text-gray-500">Start delivering to see your completed orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {todayCompleted.map((order) => (
                  <Card key={order.id} className="border-green-100 bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{order.restaurant_name}</h4>
                            <p className="text-sm text-gray-600">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₦{order.total?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">+₦{order.delivery_fee || 500} earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Card className="border-gray-100 hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}