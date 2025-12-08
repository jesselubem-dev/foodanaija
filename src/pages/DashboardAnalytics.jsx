import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function DashboardAnalytics() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days

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

  const { data: orders = [], isLoading } = useQuery({
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

  // Calculate analytics
  const daysToShow = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysToShow));
  const filteredOrders = orders.filter(o => new Date(o.created_date) >= startDate);

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Revenue by day
  const revenueByDay = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayOrders = orders.filter(o => {
      const orderDate = startOfDay(new Date(o.created_date));
      return orderDate.getTime() === dayStart.getTime() && o.status !== 'cancelled';
    });
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    revenueByDay.push({
      date: format(date, 'MMM d'),
      revenue: dayRevenue,
      orders: dayOrders.length
    });
  }

  // Top selling items
  const itemSales = {};
  filteredOrders.forEach(order => {
    if (order.status !== 'cancelled') {
      order.items?.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].revenue += item.price * item.quantity;
      });
    }
  });
  
  const topItems = Object.values(itemSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Order status distribution
  const statusDistribution = [
    { name: 'Completed', value: completedOrders },
    { name: 'Cancelled', value: cancelledOrders },
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length },
    { name: 'In Progress', value: filteredOrders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)).length }
  ].filter(item => item.value > 0);

  if (!restaurant) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your restaurant's performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Avg Order Value"
          value={`₦${Math.round(averageOrderValue).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%`}
          icon={Users}
          color="bg-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `₦${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sales data available</p>
            ) : (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'][index]
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} sold</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600">₦{item.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}