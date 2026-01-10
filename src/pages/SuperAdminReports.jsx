import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Download, Calendar, TrendingUp, Users, Bike, ShoppingCart,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SuperAdminReports() {
  const [period, setPeriod] = useState('daily');
  const [reportType, setReportType] = useState('restaurants');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('CustomerHome');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['all-riders'],
    queryFn: () => base44.entities.Rider.list(),
  });

  const getDateRange = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'daily':
        return { start: startOfToday, end: now, label: 'Today' };
      case 'weekly': {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        return { start: startOfWeek, end: now, label: 'This Week' };
      }
      case 'monthly': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now, label: 'This Month' };
      }
      default:
        return { start: startOfToday, end: now, label: 'Today' };
    }
  };

  const filterByDateRange = (items, dateField = 'created_date') => {
    const { start, end } = getDateRange();
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  const restaurantReportData = (() => {
    const filteredRestaurants = filterByDateRange(restaurants);
    const approvedCount = filteredRestaurants.filter(r => r.is_approved).length;
    const openCount = filteredRestaurants.filter(r => r.is_open).length;
    const totalRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_date);
        const { start, end } = getDateRange();
        return orderDate >= start && orderDate <= end;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const chartData = restaurants.slice(0, 10).map(r => ({
      name: r.name.substring(0, 15),
      revenue: orders.filter(o => o.restaurant_id === r.id).reduce((sum, o) => sum + (o.total || 0), 0),
      orders: orders.filter(o => o.restaurant_id === r.id).length,
      rating: r.rating || 0,
    }));

    return {
      total: filteredRestaurants.length,
      approved: approvedCount,
      open: openCount,
      totalRevenue,
      chartData,
    };
  })();

  const orderReportData = (() => {
    const filteredOrders = filterByDateRange(orders);
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    const chartData = filteredOrders.reduce((acc, order) => {
      const dateKey = new Date(order.created_date).toLocaleDateString();
      const existing = acc.find(d => d.date === dateKey);
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total || 0;
      } else {
        acc.push({
          date: dateKey,
          orders: 1,
          revenue: order.total || 0,
        });
      }
      return acc;
    }, []);

    const statusDistribution = [
      { name: 'Delivered', value: deliveredOrders.length, color: '#10b981' },
      { name: 'Pending', value: pendingOrders.length, color: '#f59e0b' },
      { name: 'Declined', value: filteredOrders.filter(o => o.status === 'declined').length, color: '#ef4444' },
      { name: 'Accepted', value: filteredOrders.filter(o => o.status === 'accepted').length, color: '#3b82f6' },
    ].filter(s => s.value > 0);

    return {
      total: filteredOrders.length,
      delivered: deliveredOrders.length,
      pending: pendingOrders.length,
      totalRevenue,
      avgOrderValue,
      chartData,
      statusDistribution,
    };
  })();

  const riderReportData = (() => {
    const filteredRiders = filterByDateRange(riders);
    const activeRiders = filteredRiders.filter(r => r.is_active).length;
    const availableRiders = filteredRiders.filter(r => r.is_available).length;
    const totalDeliveries = filteredRiders.reduce((sum, r) => sum + (r.total_deliveries || 0), 0);
    const avgRating = filteredRiders.length > 0 
      ? (filteredRiders.reduce((sum, r) => sum + (r.rating || 0), 0) / filteredRiders.length).toFixed(2)
      : 0;

    const chartData = filteredRiders
      .sort((a, b) => (b.total_deliveries || 0) - (a.total_deliveries || 0))
      .slice(0, 10)
      .map(r => ({
        name: r.full_name.substring(0, 15),
        deliveries: r.total_deliveries || 0,
        rating: r.rating || 0,
        vehicle: r.vehicle_type,
      }));

    return {
      total: filteredRiders.length,
      active: activeRiders,
      available: availableRiders,
      totalDeliveries,
      avgRating,
      chartData,
    };
  })();

  const handleExportReport = () => {
    const reportData = {
      period,
      reportType,
      generatedAt: new Date().toLocaleString(),
      restaurants: restaurantReportData,
      orders: orderReportData,
      riders: riderReportData,
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2)));
    element.setAttribute('download', `fooda_report_${period}_${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const { label } = getDateRange();

  const renderRestaurantReport = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total Restaurants"
          value={restaurantReportData.total}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Approved"
          value={restaurantReportData.approved}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Open Now"
          value={restaurantReportData.open}
          icon={<Calendar className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${restaurantReportData.totalRevenue.toLocaleString()}`}
          icon={<BarChart3 className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Restaurants by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={restaurantReportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#f97316" name="Revenue" />
              <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderReport = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={orderReportData.total}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Delivered"
          value={orderReportData.delivered}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Pending"
          value={orderReportData.pending}
          icon={<Calendar className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${orderReportData.totalRevenue.toLocaleString()}`}
          icon={<BarChart3 className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Avg Order"
          value={`₦${Math.round(orderReportData.avgOrderValue).toLocaleString()}`}
          icon={<LineChartIcon className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderReportData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderReportData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderReportData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRiderReport = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-5 gap-4">
        <StatCard
          title="Total Riders"
          value={riderReportData.total}
          icon={<Bike className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active"
          value={riderReportData.active}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Available"
          value={riderReportData.available}
          icon={<Calendar className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Total Deliveries"
          value={riderReportData.totalDeliveries}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Avg Rating"
          value={riderReportData.avgRating}
          icon={<BarChart3 className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Riders by Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riderReportData.chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#f97316" name="Deliveries" />
              <Bar dataKey="rating" fill="#fbbf24" name="Rating" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('SuperAdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500">{label} • Super Admin</p>
              </div>
            </div>
            <Button
              onClick={handleExportReport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {[
                { id: 'restaurants', label: 'Restaurants', icon: Users },
                { id: 'orders', label: 'Orders', icon: ShoppingCart },
                { id: 'riders', label: 'Riders', icon: Bike },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setReportType(id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    reportType === id
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {reportType === 'restaurants' && renderRestaurantReport()}
        {reportType === 'orders' && renderOrderReport()}
        {reportType === 'riders' && renderRiderReport()}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  const iconMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
  };

  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`${iconMap[color]} opacity-80`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}