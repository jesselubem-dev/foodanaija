import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Store, Users, ShoppingBag, DollarSign, TrendingUp, 
  CheckCircle, XCircle, Clock, ChevronRight, UtensilsCrossed, Headset, BarChart3, MessageCircle, Menu, X, LayoutDashboard, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

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
    refetchInterval: 10000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['all-riders'],
    queryFn: () => base44.entities.Rider.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['all-chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list(),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: drinkOrders = [] } = useQuery({
    queryKey: ['all-drink-orders'],
    queryFn: () => base44.entities.DrinkOrder.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const pendingRestaurants = restaurants.filter(r => !r.is_approved);
  const activeRestaurants = restaurants.filter(r => r.is_approved);
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredOrders = orders.filter(o => o.delivery_status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const totalRiderEarnings = deliveredOrders.reduce((sum, o) => sum + (o.delivery_fee || 500), 0);
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  // Calculate revenue per restaurant (include all paid orders)
  const restaurantRevenue = restaurants.map(restaurant => {
    const restaurantOrders = orders.filter(o => 
      o.restaurant_id === restaurant.id && o.payment_status === 'paid'
    );
    const revenue = restaurantOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      ...restaurant,
      revenue,
      orderCount: restaurantOrders.length
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Calculate earnings per rider
  // Count active chats with unread messages
  const activeChatCount = chatMessages.reduce((acc, msg) => {
    if (msg.sender_type === 'customer' && !msg.is_read) {
      if (!acc.includes(msg.chat_id)) {
        acc.push(msg.chat_id);
      }
    }
    return acc;
  }, []).length;

  const riderEarnings = riders.map(rider => {
    const riderDeliveries = orders.filter(o => 
      o.rider_id === rider.id && o.delivery_status === 'delivered'
    );
    const earnings = riderDeliveries.reduce((sum, o) => sum + (o.delivery_fee || 500), 0);
    return {
      ...rider,
      earnings,
      deliveryCount: riderDeliveries.length
    };
  }).sort((a, b) => b.earnings - a.earnings);

  const markRefundedMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { refunded: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast.success('Order marked as refunded');
    },
    onError: () => {
      toast.error('Failed to update refund status');
    }
  });

  const handleMarkRefunded = (orderId) => {
    markRefundedMutation.mutate(orderId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-orange-100 z-50 hidden lg:block overflow-y-auto">
        <div className="p-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
            alt="Fooda Naija" 
            className="h-12 w-auto object-contain"
          />
        </div>
        
        <nav className="px-4 space-y-1 pb-6">
          <SidebarNavLink to="SuperAdminDashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarNavLink to="SuperAdminRestaurants" icon={Store} label="Restaurants" count={pendingRestaurants.length} />
          <SidebarNavLink to="SuperAdminUsers" icon={Users} label="Users" />
          <SidebarNavLink to="SuperAdminOrders" icon={ShoppingBag} label="Orders" count={orders.filter(o => o.status === 'pending').length} />
          <SidebarNavLink to="SuperAdminCancelledOrders" icon={XCircle} label="Cancelled Orders" count={cancelledOrders.filter(o => !o.refunded).length} />
          <SidebarNavLink to="SuperAdminRiders" icon={Users} label="Riders" />
          <SidebarNavLink to="SuperAdminRiderComplaints" icon={MessageCircle} label="Rider Complaints" />
          <SidebarNavLink to="SuperAdminDrinks" icon={UtensilsCrossed} label="Drinks" />
          <SidebarNavLink to="SuperAdminDrinkOrders" icon={ShoppingBag} label="Drink Orders" count={drinkOrders.filter(o => o.status === 'pending').length} />
          <SidebarNavLink to="AdminLiveChat" icon={Headset} label="Live Chat" count={activeChatCount} />
          <SidebarNavLink to="SuperAdminMessages" icon={MessageCircle} label="Messages" />
          <SidebarNavLink to="SuperAdminReports" icon={BarChart3} label="Reports" />
          <SidebarNavLink to="SuperAdminMenuMarketing" icon={Share2} label="Marketing Links" />
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50 px-4 flex items-center justify-between">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
          alt="Fooda Naija" 
          className="h-10 w-auto object-contain"
        />
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-16 bottom-0 w-64 bg-white p-4 space-y-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <SidebarNavLink to="SuperAdminDashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminRestaurants" icon={Store} label="Restaurants" count={pendingRestaurants.length} onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminUsers" icon={Users} label="Users" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminOrders" icon={ShoppingBag} label="Orders" count={orders.filter(o => o.status === 'pending').length} onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminCancelledOrders" icon={XCircle} label="Cancelled Orders" count={cancelledOrders.filter(o => !o.refunded).length} onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminRiders" icon={Users} label="Riders" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminRiderComplaints" icon={MessageCircle} label="Rider Complaints" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminDrinks" icon={UtensilsCrossed} label="Drinks" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminDrinkOrders" icon={ShoppingBag} label="Drink Orders" count={drinkOrders.filter(o => o.status === 'pending').length} onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="AdminLiveChat" icon={Headset} label="Live Chat" count={activeChatCount} onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminMessages" icon={MessageCircle} label="Messages" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminReports" icon={BarChart3} label="Reports" onClick={() => setMobileMenuOpen(false)} />
            <SidebarNavLink to="SuperAdminMenuMarketing" icon={Share2} label="Marketing Links" onClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 p-6">
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
          <StatCard
            title="Active Riders"
            value={riders.length}
            icon={Users}
            color="blue"
            subtitle={`${riders.filter(r => r.is_available).length} available`}
          />
          <StatCard
            title="Rider Earnings"
            value={`₦${totalRiderEarnings.toLocaleString()}`}
            icon={TrendingUp}
            color="emerald"
            subtitle={`${deliveredOrders.length} deliveries`}
          />
          <StatCard
            title="Cancelled Orders"
            value={cancelledOrders.length}
            icon={XCircle}
            color="orange"
            subtitle={`${orders.length} total orders`}
          />
          </div>

          {/* Today's Orders */}
          <Card className="border-orange-100 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Orders</span>
                <Badge className="bg-orange-100 text-orange-700">{todayOrders.length} orders</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No orders today yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {todayOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.restaurant_name}</p>
                        <p className="text-sm text-gray-500">
                          {order.customer_name} • {order.customer_phone || order.customer_email}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(order.created_date).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">₦{order.total?.toLocaleString()}</p>
                        <div className="flex gap-1 justify-end mt-1">
                          <Badge className={
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {order.status}
                          </Badge>
                          <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

        {/* Cancelled Orders Breakdown */}
        <Card className="border-red-100 mb-8">
          <CardHeader>
            <CardTitle>Cancelled Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cancelledOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.restaurant_name}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer_name} • {new Date(order.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-lg font-bold text-red-600">₦{order.total.toLocaleString()}</p>
                      <Badge className={order.refunded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {order.refunded ? 'Refunded' : 'Not Refunded'}
                      </Badge>
                    </div>
                    {!order.refunded && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkRefunded(order.id)}
                        disabled={markRefundedMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Refunded
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {cancelledOrders.length === 0 && (
                <p className="text-center text-gray-500 py-4">No cancelled orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rider Earnings Breakdown */}
        <Card className="border-blue-100 mb-8">
          <CardHeader>
            <CardTitle>Rider Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riderEarnings.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rider.full_name}</p>
                      <p className="text-sm text-gray-500">{rider.deliveryCount} deliveries • ₦{rider.deliveryCount > 0 ? Math.round(rider.earnings / rider.deliveryCount) : 0}/delivery</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">₦{rider.earnings.toLocaleString()}</p>
                    <Badge className={rider.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {rider.is_available ? 'Available' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              ))}
              {riderEarnings.length === 0 && (
                <p className="text-center text-gray-500 py-4">No rider data yet</p>
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
      </main>
    </div>
  );
}

function SidebarNavLink({ to, icon: Icon, label, count, onClick }) {
  return (
    <Link 
      to={createPageUrl(to)} 
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative text-gray-600 hover:bg-orange-50"
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {count > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle, link }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
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