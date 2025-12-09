import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Store, Users, ShoppingBag, DollarSign, TrendingUp, 
  CheckCircle, XCircle, Clock, ChevronRight, UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      // Allow access if user is admin OR app creator
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
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
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user,
  });

  const pendingRestaurants = restaurants.filter(r => !r.is_approved);
  const activeRestaurants = restaurants.filter(r => r.is_approved);
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  // Calculate revenue per restaurant
  const restaurantRevenue = restaurants.map(restaurant => {
    const restaurantOrders = orders.filter(o => 
      o.restaurant_id === restaurant.id && o.status === 'delivered'
    );
    const revenue = restaurantOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      ...restaurant,
      revenue,
      orderCount: restaurantOrders.length
    };
  }).sort((a, b) => b.revenue - a.revenue);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Restaurants"
            value={restaurants.length}
            icon={Store}
            color="blue"
            subtitle={`${activeRestaurants.length} active`}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingRestaurants.length}
            icon={Clock}
            color="amber"
            link={createPageUrl('SuperAdminRestaurants')}
          />
          <StatCard
            title="Total Menu Items"
            value={menuItems.length}
            icon={UtensilsCrossed}
            color="emerald"
            subtitle={`Across all restaurants`}
          />
          <StatCard
            title="Platform Revenue"
            value={`₦${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to={createPageUrl('SuperAdminRestaurants')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Manage Restaurants</CardTitle>
                <Store className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingRestaurants.length} pending approval
                </p>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-orange-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('SuperAdminUsers')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Manage Users</CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-blue-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('SuperAdminOrders')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">View All Orders</CardTitle>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">Platform-wide orders</p>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-emerald-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Restaurant Revenue Breakdown */}
        <Card className="border-orange-100 mb-8">
          <CardHeader>
            <CardTitle>Revenue by Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurantRevenue.filter(r => r.is_approved).slice(0, 10).map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Store className="w-5 h-5 text-orange-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-500">{restaurant.city} • {restaurant.orderCount} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">₦{restaurant.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {restaurantRevenue.filter(r => r.is_approved).length === 0 && (
                <p className="text-center text-gray-500 py-4">No revenue data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle>Recent Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurants.slice(0, 5).map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Store className="w-5 h-5 text-orange-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-500">{restaurant.city}</p>
                    </div>
                  </div>
                  <Badge className={restaurant.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {restaurant.is_approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle, link }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className="border-orange-50">
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}