import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Package, DollarSign, UtensilsCrossed, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length === 0) {
        navigate(createPageUrl('RestaurantSetup'));
        return;
      }
      
      setRestaurant(restaurants[0]);
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['restaurantOrders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return await base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date');
    },
    enabled: !!restaurant?.id
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['restaurantMenuItems', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return await base44.entities.MenuItem.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant?.id
  });

  // Calculate stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_date).toDateString() === today);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (!restaurant) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant.is_approved) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Approval</h2>
            <p className="text-gray-600 mb-6">
              Your restaurant is currently under review. You'll be notified once it's approved and live on Foodanaija.
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 text-left">
              <p className="font-semibold text-emerald-900 mb-2">{restaurant.name}</p>
              <p className="text-sm text-gray-600">{restaurant.address}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
        <p className="text-gray-600">Here's what's happening with {restaurant.name} today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Orders"
          value={todayOrders.length}
          icon={Package}
          color="bg-blue-500"
          trend={`${pendingOrders.length} pending`}
        />
        <StatCard
          title="Today's Revenue"
          value={`₦${todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Menu Items"
          value={menuItems.length}
          icon={UtensilsCrossed}
          color="bg-amber-500"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-600">{order.customer_name} • {order.items?.length} items</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.created_date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 text-lg">₦{order.total?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <QuickActionCard
          title="Manage Menu"
          description="Add or edit menu items"
          icon={UtensilsCrossed}
          onClick={() => navigate(createPageUrl('DashboardMenu'))}
          color="bg-emerald-500"
        />
        <QuickActionCard
          title="View Orders"
          description="Check pending orders"
          icon={Package}
          onClick={() => navigate(createPageUrl('DashboardOrders'))}
          color="bg-blue-500"
          badge={pendingOrders.length > 0 ? pendingOrders.length : null}
        />
        <QuickActionCard
          title="Analytics"
          description="View detailed reports"
          icon={TrendingUp}
          onClick={() => navigate(createPageUrl('DashboardAnalytics'))}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {trend && <p className="text-sm text-gray-500">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    ready: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <Badge className={config[status] || config.pending}>
      {status}
    </Badge>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, color, badge }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-2xl p-6 border border-emerald-50 hover:shadow-lg transition-all text-left group"
    >
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {badge && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </div>
      )}
    </button>
  );
}