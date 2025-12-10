import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList, 
  BarChart3, Settings, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NoInternet from './components/NoInternet';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if user owns a restaurant
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      }
    } catch (e) {
      // Not logged in
    }
  };

  // Pages that don't need layout
  const noLayoutPages = ['SuperAdminDashboard', 'SuperAdminRestaurants', 'SuperAdminUsers', 'SuperAdminOrders', 'SuperAdminMessages', 'Home', 'Onboarding', 'CustomerHome', 'RestaurantDetail', 'Cart', 'Checkout', 'OrderConfirmation', 'OrderHistory'];
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        {children}
      </div>
    );
  }

  // Allow RestaurantSetup page to render without restaurant
  if (!restaurant && currentPageName !== 'RestaurantSetup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no restaurant and on RestaurantSetup, show minimal layout
  if (!restaurant && currentPageName === 'RestaurantSetup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      <NoInternet />
      {/* Dashboard Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-orange-100 z-50 hidden lg:block">
        <div className="p-6">
          <Link to={createPageUrl('DashboardHome')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900">Foodanaija</span>
              <span className="block text-xs text-orange-600">Business Portal</span>
            </div>
          </Link>
        </div>
        
        <nav className="px-4 space-y-1">
          <DashboardNavLink to="DashboardHome" icon={LayoutDashboard} label="Dashboard" current={currentPageName} />
          <DashboardNavLink to="DashboardMenu" icon={UtensilsCrossed} label="Menu" current={currentPageName} />
          <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} restaurant={restaurant} />
          <DashboardNavLink to="DashboardAnalytics" icon={BarChart3} label="Analytics" current={currentPageName} />
          <DashboardNavLink to="DashboardSettings" icon={Settings} label="Settings" current={currentPageName} />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-orange-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <ChefHat className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{restaurant.name}</p>
              <p className="text-xs text-gray-500 truncate">{restaurant.city}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header for Dashboard */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50 px-4 flex items-center justify-between">
        <Link to={createPageUrl('DashboardHome')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Foodanaija</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-16 bottom-0 w-64 bg-white p-4 space-y-1" onClick={e => e.stopPropagation()}>
              <DashboardNavLink to="DashboardHome" icon={LayoutDashboard} label="Dashboard" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
              <DashboardNavLink to="DashboardMenu" icon={UtensilsCrossed} label="Menu" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
              <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} onClick={() => setMobileMenuOpen(false)} restaurant={restaurant} />
              <DashboardNavLink to="DashboardAnalytics" icon={BarChart3} label="Analytics" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
              <DashboardNavLink to="DashboardSettings" icon={Settings} label="Settings" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
            </div>
        </div>
      )}

      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

function DashboardNavLink({ to, icon: Icon, label, current, onClick, restaurant }) {
  const isActive = current === to;
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (to === 'DashboardOrders' && restaurant?.id) {
      const fetchOrders = async () => {
        try {
          const orders = await base44.entities.Order.filter({ restaurant_id: restaurant.id });
          const pending = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
          setPendingCount(pending.length);
        } catch (e) {
          console.error('Failed to fetch orders:', e);
        }
      };
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [restaurant?.id, to]);

  return (
    <Link 
      to={createPageUrl(to)} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
        isActive 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' 
          : 'text-gray-600 hover:bg-orange-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {to === 'DashboardOrders' && pendingCount > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {pendingCount}
        </span>
      )}
    </Link>
  );
}