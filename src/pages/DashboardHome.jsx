import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function DashboardHome() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const queryClient = useQueryClient();

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
        // Redirect to setup if no restaurant found
        window.location.href = createPageUrl('RestaurantSetup');
        return;
      }
    } catch (e) {
      console.error('Auth error:', e);
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-orders', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
    refetchInterval: 10000,
  });

  // Play alert sound when new order comes in
  useEffect(() => {
    if (orders.length > 0 && previousOrderCount > 0 && orders.length > previousOrderCount) {
      // New order detected - play sound
      const audio = new Audio('data:audio/wav;base64,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');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
    setPreviousOrderCount(orders.length);
  }, [orders]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['dashboard-menu', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', restaurant?.id],
    queryFn: () => base44.entities.Message.filter({ restaurant_id: restaurant.id }, '-created_date'),
    enabled: !!restaurant?.id,
    refetchInterval: 10000,
  });

  // Auto-update is_open based on opening/closing time
  useEffect(() => {
    if (!restaurant?.opening_time || !restaurant?.closing_time) return;

    const checkOpenStatus = async () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const shouldBeOpen = currentTime >= restaurant.opening_time && currentTime <= restaurant.closing_time;

      if (shouldBeOpen !== restaurant.is_open) {
        await base44.entities.Restaurant.update(restaurant.id, { is_open: shouldBeOpen });
        loadData();
      }
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [restaurant]);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    },
  });

  // Calculate stats
  const todayStart = startOfDay(new Date());
  const todayOrders = orders.filter(o => new Date(o.created_date) >= todayStart);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  const unreadMessages = messages.filter(m => !m.is_read);

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
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {restaurant.owner_name}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening at {restaurant.name} today.</p>
          </div>
          <div className="flex items-center gap-2">
            {restaurant.is_approved ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-green-700 font-semibold text-sm">LIVE</span>
              </div>
            ) : (
              <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-5 h-5" />
              {unreadMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadMessages.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {unreadMessages.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-900">Messages ({unreadMessages.length} unread)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="bg-white p-4 rounded-xl border border-orange-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{message.title}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsReadMutation.mutate(message.id)}
                    className="text-xs"
                  >
                    Mark as read
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{message.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  From Admin • {new Date(message.created_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Need Help? Contact Foodanaija</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>📧 Email: <a href="mailto:support@foodanaija.com" className="text-blue-600 hover:underline">support@foodanaija.com</a></p>
                <p>📞 Phone: <a href="tel:090333455557" className="text-blue-600 hover:underline">090333455557</a></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card className="lg:col-span-2 border-orange-100">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
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
                    stroke="#ff6b35" 
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
        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link to={createPageUrl('DashboardOrders')}>
              <Button variant="ghost" size="sm" className="text-orange-600">
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

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifications ({unreadMessages.length} unread)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    message.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-semibold ${message.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {message.title}
                    </h4>
                    {!message.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(message.id)}
                        className="text-xs"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                  <p className={`text-sm ${message.is_read ? 'text-gray-500' : 'text-gray-600'}`}>
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">
                      From Admin • {new Date(message.created_date).toLocaleDateString()}
                    </p>
                    {message.is_read && (
                      <Badge variant="outline" className="text-xs">Read</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="border-orange-50 hover:shadow-lg transition-shadow">
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
    <div className="bg-white rounded-2xl p-4 border border-orange-50 hover:shadow-lg transition-all cursor-pointer group">
      <div className="relative">
        <Icon className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
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