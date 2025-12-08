import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Users, UtensilsCrossed, Calendar, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { createPageUrl } from '../utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function DashboardAnalytics() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [dateRange, setDateRange] = useState('7days');

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

  const { data: orders = [] } = useQuery({
    queryKey: ['analytics-orders', restaurant?.id],
    queryFn: () => base44.entities.Order.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['analytics-menu', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
  });

  // Calculate date range
  const getDaysCount = () => {
    switch (dateRange) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 7;
    }
  };

  const daysCount = getDaysCount();
  const startDate = subDays(new Date(), daysCount - 1);
  
  const filteredOrders = orders.filter(o => 
    new Date(o.created_date) >= startDate
  );

  const completedOrders = filteredOrders.filter(o => o.status === 'delivered');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

  // Stats
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_email)).size;
  const cancelRate = filteredOrders.length > 0 ? (cancelledOrders.length / filteredOrders.length * 100) : 0;

  // Previous period comparison
  const prevStartDate = subDays(startDate, daysCount);
  const prevOrders = orders.filter(o => {
    const date = new Date(o.created_date);
    return date >= prevStartDate && date < startDate;
  });
  const prevCompletedOrders = prevOrders.filter(o => o.status === 'delivered');
  const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

  // Revenue chart data
  const revenueChartData = Array.from({ length: Math.min(daysCount, 30) }, (_, i) => {
    const date = subDays(new Date(), Math.min(daysCount, 30) - 1 - i);
    const dayOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
    });
    return {
      date: format(date, daysCount <= 7 ? 'EEE' : 'MMM d'),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      orders: dayOrders.length
    };
  });

  // Orders by status
  const ordersByStatus = [
    { name: 'Delivered', value: completedOrders.length, color: '#10b981' },
    { name: 'Cancelled', value: cancelledOrders.length, color: '#ef4444' },
    { name: 'In Progress', value: filteredOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length, color: '#3b82f6' },
  ].filter(s => s.value > 0);

  // Top selling items
  const itemSales = {};
  completedOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity || 1;
      itemSales[item.name].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // Payment methods
  const paymentMethods = {};
  completedOrders.forEach(order => {
    const method = order.payment_method || 'other';
    if (!paymentMethods[method]) paymentMethods[method] = 0;
    paymentMethods[method]++;
  });
  const paymentData = Object.entries(paymentMethods).map(([name, value], idx) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[idx % COLORS.length]
  }));

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track your restaurant performance</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Revenue"
          value={`₦${totalRevenue.toLocaleString()}`}
          change={revenueChange}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard 
          title="Total Orders"
          value={filteredOrders.length}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard 
          title="Avg Order Value"
          value={`₦${avgOrderValue.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard 
          title="Unique Customers"
          value={uniqueCustomers}
          icon={Users}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']}
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

        {/* Orders by Status */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {ordersByStatus.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No sales data yet</div>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">₦{item.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment data yet</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData} layout="vertical">
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="border-emerald-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}