import React, { useState, useEffect, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function SuperAdminReports() {
  const [period, setPeriod] = useState('daily');
  const [reportType, setReportType] = useState('restaurants');
  const [user, setUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportContentRef = useRef(null);

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

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => base44.entities.Review.list(),
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
      case 'yearly': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: now, label: 'This Year' };
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

  const handleExportReport = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to check and add new page
      const checkNewPage = (neededHeight) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Title and Header
      pdf.setFillColor(31, 41, 55);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('FOODA NAIJA', margin, 12);
      pdf.setFontSize(10);
      pdf.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${period.charAt(0).toUpperCase() + period.slice(1)}`, margin, 20);

      yPosition = 35;

      // Report Info
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 8;

      // Stats Section
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Metrics', margin, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);

      const statColWidth = (pageWidth - 2 * margin) / 4;
      const stats = reportType === 'restaurants' 
        ? [
            { label: 'Total Restaurants', value: restaurantReportData.total },
            { label: 'Approved', value: restaurantReportData.approved },
            { label: 'Open Now', value: restaurantReportData.open },
            { label: 'Revenue', value: `₦${restaurantReportData.totalRevenue.toLocaleString()}` },
          ]
        : reportType === 'orders'
        ? [
            { label: 'Total Orders', value: orderReportData.total },
            { label: 'Delivered', value: orderReportData.delivered },
            { label: 'Pending', value: orderReportData.pending },
            { label: 'Revenue', value: `₦${orderReportData.totalRevenue.toLocaleString()}` },
          ]
        : [
            { label: 'Total Riders', value: riderReportData.total },
            { label: 'Active', value: riderReportData.active },
            { label: 'Available', value: riderReportData.available },
            { label: 'Deliveries', value: riderReportData.totalDeliveries },
          ];

      stats.forEach((stat, idx) => {
        const x = margin + idx * statColWidth;
        pdf.setFillColor(243, 244, 246);
        pdf.rect(x, yPosition, statColWidth - 5, 20, 'F');
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);
        pdf.text(stat.label, x + 5, yPosition + 6);
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.text(stat.value.toString(), x + 5, yPosition + 15);
      });

      yPosition += 30;

      // Charts Section
      checkNewPage(120);
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(12);
      pdf.text('Analytics', margin, yPosition);
      yPosition += 10;

      // For overall report, capture all charts
      if (reportType === 'overall') {
        // Main revenue trend chart
        const mainChart = document.querySelector('[data-chart="main"]');
        if (mainChart) {
          const canvas = await html2canvas(mainChart, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = pageWidth - 2 * margin;
          const chartHeight = (chartWidth * canvas.height) / canvas.width;

          if (checkNewPage(chartHeight + 10)) {
            yPosition += 5;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 15;
        }

        // Add main revenue chart
        const mainChart = document.querySelector('[data-chart="main"]');
        if (mainChart) {
          const canvas = await html2canvas(mainChart, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = pageWidth - 2 * margin;
          const chartHeight = (chartWidth * canvas.height) / canvas.width;

          if (checkNewPage(chartHeight + 10)) {
            yPosition += 5;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 15;
        }
      } else {
        // Capture and add chart for other report types
        const chartElement = document.querySelector('[data-chart="main"]');
        if (chartElement) {
          const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = pageWidth - 2 * margin;
          const chartHeight = (chartWidth * canvas.height) / canvas.width;

          if (checkNewPage(chartHeight + 5)) {
            yPosition += 5;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 10;
        }

        // Status chart if available
        const statusChart = document.querySelector('[data-chart="status"]');
        if (statusChart) {
          checkNewPage(100);
          const canvas = await html2canvas(statusChart, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const chartWidth = (pageWidth - 3 * margin) / 2;
          const chartHeight = (chartWidth * canvas.height) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 10;
        }
      }

      // Summary
      checkNewPage(30);
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(12);
      pdf.text('Report Summary', margin, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      let summaryText = '';
      if (reportType === 'overall') {
        summaryText = `Platform Summary: ${restaurants.length} restaurants, ${orders.filter(o => new Date(o.created_date) >= getDateRange().start && new Date(o.created_date) <= getDateRange().end).length} orders processed, ${riders.filter(r => r.is_active).length} active riders. Overall platform revenue: ₦${orders.filter(o => new Date(o.created_date) >= getDateRange().start && new Date(o.created_date) <= getDateRange().end).reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}.`;
      } else if (reportType === 'restaurants') {
        summaryText = `Total of ${restaurantReportData.total} restaurants with ${restaurantReportData.approved} approved. Platform generated ₦${restaurantReportData.totalRevenue.toLocaleString()} revenue.`;
      } else if (reportType === 'orders') {
        summaryText = `Total of ${orderReportData.total} orders processed. ${orderReportData.delivered} successfully delivered. Average order value: ₦${Math.round(orderReportData.avgOrderValue).toLocaleString()}.`;
      } else {
        summaryText = `Total of ${riderReportData.total} active riders completed ${riderReportData.totalDeliveries} deliveries. Average rating: ${riderReportData.avgRating}/5.`;
      }

      pdf.text(summaryText, margin, yPosition, { maxWidth: pageWidth - 2 * margin, align: 'left' });

      // Footer
      const totalPages = pdf.internal.pages.length;
      for (let i = 1; i < totalPages; i++) {
        pdf.setPage(i);
        pdf.setTextColor(160, 174, 192);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(`fooda_report_${reportType}_${period}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const { label } = getDateRange();

  const renderRestaurantReport = () => (
    <div className="space-y-6" ref={reportContentRef}>
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
        <CardContent data-chart="main">
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
    <div className="space-y-6" ref={reportContentRef}>
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
          <CardContent data-chart="main">
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
          <CardContent data-chart="status">
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

  const renderOverallReport = () => {
    const totalRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_date);
        const { start, end } = getDateRange();
        return orderDate >= start && orderDate <= end;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalRiderEarnings = orders
      .filter(o => o.delivery_status === 'delivered')
      .reduce((sum, o) => sum + (o.delivery_fee || 500), 0);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(new Date().getFullYear(), i, 1);
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.created_date);
        return orderDate.getMonth() === i && orderDate.getFullYear() === new Date().getFullYear();
      });
      return {
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: monthOrders.length,
      };
    }).filter(d => d.revenue > 0 || d.orders > 0);

    const restaurantWithStats = restaurants.map(r => ({
      ...r,
      revenue: orders.filter(o => o.restaurant_id === r.id).reduce((sum, o) => sum + (o.total || 0), 0),
      orderCount: orders.filter(o => o.restaurant_id === r.id).length,
      avgRating: reviews.filter(rv => rv.restaurant_id === r.id).length > 0
        ? (reviews.filter(rv => rv.restaurant_id === r.id).reduce((sum, rv) => sum + rv.rating, 0) / 
           reviews.filter(rv => rv.restaurant_id === r.id).length).toFixed(1)
        : 'N/A',
    }));

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const customerCount = new Set(orders.map(o => o.customer_email)).size;
    const avgOrdersPerRestaurant = restaurants.length > 0 ? orders.length / restaurants.length : 0;

    return (
      <div className="space-y-6" ref={reportContentRef}>
        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={users.length}
            icon={<Users className="w-6 h-6" />}
            color="indigo"
          />
          <StatCard
            title="Total Restaurants"
            value={restaurants.length}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="Active Riders"
            value={riders.filter(r => r.is_active).length}
            icon={<Bike className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={`₦${totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-5 gap-4">
          <div data-section="metrics-card">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-bold text-indigo-600">{users.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customers</span>
                  <span className="font-bold text-blue-600">{customerCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg/Order</span>
                  <span className="font-bold text-purple-600">₦{Math.round(avgOrderValue).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div data-section="metrics-card">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Restaurant Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-bold text-green-600">{restaurants.filter(r => r.is_approved).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold text-amber-600">{restaurants.filter(r => !r.is_approved).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Open Now</span>
                  <span className="font-bold text-blue-600">{restaurants.filter(r => r.is_open).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div data-section="metrics-card">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivered</span>
                  <span className="font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold text-amber-600">{orders.filter(o => o.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Declined</span>
                  <span className="font-bold text-red-600">{orders.filter(o => o.status === 'declined').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div data-section="metrics-card">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delivery Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Deliveries</span>
                  <span className="font-bold text-blue-600">{orders.filter(o => o.delivery_status === 'delivered').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rider Earnings</span>
                  <span className="font-bold text-green-600">₦{totalRiderEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Rating</span>
                  <span className="font-bold text-yellow-600">
                    {riders.length > 0 ? (riders.reduce((sum, r) => sum + (r.rating || 0), 0) / riders.length).toFixed(2) : 0}★
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div data-section="metrics-card">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Riders Active</span>
                  <span className="font-bold text-green-600">{riders.filter(r => r.is_active).length}/{riders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Orders/Rest</span>
                  <span className="font-bold text-orange-600">{Math.round(avgOrdersPerRestaurant)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reviews</span>
                  <span className="font-bold text-purple-600">{reviews.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent data-chart="main">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" name="Revenue" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers & Detailed Lists */}
        <div className="grid lg:grid-cols-2 gap-4" data-section="top-performers">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Restaurants by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {restaurantWithStats
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 10)
                  .map((r, idx) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{idx + 1}. {r.name}</span>
                        <p className="text-gray-600">{r.orderCount} orders • {r.city}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600">₦{r.revenue.toLocaleString()}</span>
                        <p className="text-gray-600">{r.avgRating}★</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Riders by Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {riders
                  .sort((a, b) => (b.total_deliveries || 0) - (a.total_deliveries || 0))
                  .slice(0, 10)
                  .map((r, idx) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{idx + 1}. {r.full_name}</span>
                        <p className="text-gray-600">{r.vehicle_type} • {r.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600">{r.total_deliveries || 0} deliveries</span>
                        <p className="text-amber-600">{r.rating}★</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>All Restaurants Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {restaurantWithStats
                  .map((r, idx) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs border-l-4 border-orange-500">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{r.name}</span>
                        <p className="text-gray-600">{r.city} • {r.owner_name}</p>
                        <p className="text-gray-500">Status: {r.is_approved ? '✓ Approved' : '⏳ Pending'} | {r.is_open ? '🟢 Open' : '🔴 Closed'}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="font-bold text-green-600">₦{r.revenue.toLocaleString()}</div>
                        <div className="text-gray-600">{r.orderCount} orders</div>
                        <div className="text-amber-600">{r.avgRating}★</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderRiderReport = () => (
    <div className="space-y-6" ref={reportContentRef}>
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
        <CardContent data-chart="main">
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
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </>
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
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
                { id: 'overall', label: 'Overall', icon: BarChart3 },
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
        {reportType === 'overall' && renderOverallReport()}
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