import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { 
  TrendingUp, ShoppingBag, DollarSign, UtensilsCrossed,
  Clock, CheckCircle, XCircle, ChevronRight, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function DashboardHome() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      } else {
        window.location.href = createPageUrl('RestaurantSetup');
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-orders', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['dashboard-menu', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
  });

  // Calculate stats
  const todayStart = startOfDay(new Date());
  const todayOrders = orders.filter(o => new Date(o.created_date) >= todayStart);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

  // Chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
    });
    return {
      day: format(date, 'EEE'),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  });

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            {!restaurant.is_approved && (
              <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>
            )}
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Today's Orders" 
          value={todayOrders.length}
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₦${todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard 
          title="Menu Items" 
          value={menuItems.length}
          icon={UtensilsCrossed}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `₦${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link to={createPageUrl('DashboardOrders')}>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordersLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : orders.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No orders yet</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <OrderItem key={order.id} order={order} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Link to={createPageUrl('DashboardMenu')}>
          <QuickAction icon={UtensilsCrossed} label="Manage Menu" />
        </Link>
        <Link to={createPageUrl('DashboardOrders')}>
          <QuickAction icon={ShoppingBag} label="View Orders" count={pendingOrders.length} />
        </Link>
        <Link to={createPageUrl('DashboardAnalytics')}>
          <QuickAction icon={TrendingUp} label="Analytics" />
        </Link>
        <Link to={createPageUrl('DashboardSettings')}>
          <QuickAction icon={Clock} label="Settings" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="border-emerald-50 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </CardContent>
    </Card>
  );
}

function OrderItem({ order }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    ready: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="font-medium text-gray-900 text-sm">{order.customer_name || 'Customer'}</p>
        <p className="text-xs text-gray-500">
          {order.items?.length || 0} items • ₦{order.total?.toLocaleString()}
        </p>
      </div>
      <Badge className={statusColors[order.status]}>
        {order.status}
      </Badge>
    </div>
  );
}

function QuickAction({ icon: Icon, label, count }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-emerald-50 hover:shadow-lg transition-all cursor-pointer group">
      <div className="relative">
        <Icon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
      <p className="font-medium text-gray-700 text-sm">{label}</p>
    </div>
  );
}