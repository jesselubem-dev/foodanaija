import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Bike, Package, Clock, CheckCircle, MapPin, Star, Phone, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function RiderDashboard() {
  const [user, setUser] = useState(null);
  const [rider, setRider] = useState(null);

  useEffect(() => {
    checkRider();
  }, []);

  const checkRider = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
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

  const { data: orders = [] } = useQuery({
    queryKey: ['rider-orders', rider?.id],
    queryFn: () => base44.entities.Order.filter({ rider_id: rider.id }),
    enabled: !!rider,
    refetchInterval: 5000,
  });

  const toggleAvailability = async () => {
    await base44.entities.Rider.update(rider.id, {
      is_available: !rider.is_available
    });
    setRider({ ...rider, is_available: !rider.is_available });
  };

  const assignedOrders = orders.filter(o => o.delivery_status === 'assigned');
  const activeOrders = orders.filter(o => ['picked_up', 'on_the_way'].includes(o.delivery_status));
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');
  const todayEarnings = completedOrders
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pb-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rider Portal</h1>
                <p className="text-sm text-gray-500">{rider.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Available</span>
                <Switch
                  checked={rider.is_available}
                  onCheckedChange={toggleAvailability}
                />
              </div>
              <Button
                onClick={() => base44.auth.logout()}
                variant="outline"
                className="rounded-xl"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Package}
            title="New Orders"
            value={assignedOrders.length}
            color="blue"
          />
          <StatCard
            icon={Clock}
            title="Active Deliveries"
            value={activeOrders.length}
            color="orange"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed Today"
            value={completedOrders.filter(o => {
              const orderDate = new Date(o.created_date);
              const today = new Date();
              return orderDate.toDateString() === today.toDateString();
            }).length}
            color="green"
          />
          <StatCard
            icon={Star}
            title="Today's Earnings"
            value={`₦${todayEarnings.toLocaleString()}`}
            color="purple"
          />
        </div>

        {/* Active Deliveries */}
        {activeOrders.length > 0 && (
          <Card className="mb-6 border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Active Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <Link key={order.id} to={createPageUrl(`RiderDelivery?id=${order.id}`)}>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{order.restaurant_name}</h3>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                        </div>
                        <Badge className="bg-orange-500 text-white">
                          {order.delivery_status === 'picked_up' ? 'Picked Up' : 'On The Way'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{order.delivery_address}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Assignments */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              New Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No new assignments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedOrders.map((order) => (
                  <Link key={order.id} to={createPageUrl(`RiderDelivery?id=${order.id}`)}>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{order.restaurant_name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.customer_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {order.customer_phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{order.items?.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{order.delivery_address}</span>
                      </div>
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl">
                        Start Delivery
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </CardContent>
    </Card>
  );
}