import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Search, ShoppingBag, User, ChefHat, 
  LayoutDashboard, UtensilsCrossed, ClipboardList, 
  BarChart3, Settings, LogOut, Menu, X, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadCart();
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

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  useEffect(() => {
    const handleStorageChange = () => loadCart();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, []);

  const isDashboard = currentPageName?.startsWith('Dashboard') || currentPageName === 'RestaurantSetup';

  // Dashboard pages
  if (isDashboard && restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        {/* Dashboard Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-emerald-100 z-50 hidden lg:block">
          <div className="p-6">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-gray-900">Foodanaija</span>
                <span className="block text-xs text-emerald-600">Business Portal</span>
              </div>
            </Link>
          </div>
          
          <nav className="px-4 space-y-1">
            <DashboardNavLink to="DashboardHome" icon={LayoutDashboard} label="Dashboard" current={currentPageName} />
            <DashboardNavLink to="DashboardMenu" icon={UtensilsCrossed} label="Menu" current={currentPageName} />
            <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} />
            <DashboardNavLink to="DashboardAnalytics" icon={BarChart3} label="Analytics" current={currentPageName} />
            <DashboardNavLink to="DashboardSettings" icon={Settings} label="Settings" current={currentPageName} />
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <ChefHat className="w-5 h-5 text-emerald-600" />
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
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-emerald-100 z-50 px-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Business</span>
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
              <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
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

  // Customer App Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Customer Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-emerald-100 z-50 px-4 flex items-center justify-between">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            Foodanaija
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && restaurant && (
            <Link to={createPageUrl('DashboardHome')}>
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          )}
          <Link to={createPageUrl('Cart')} className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-emerald-100 z-50 flex items-center justify-around px-4 safe-area-inset-bottom">
        <NavLink to="Home" icon={Home} label="Home" current={currentPageName} />
        <NavLink to="Search" icon={Search} label="Search" current={currentPageName} />
        <NavLink to="Orders" icon={ClipboardList} label="Orders" current={currentPageName} />
        <NavLink to="Profile" icon={User} label="Profile" current={currentPageName} />
      </nav>
    </div>
  );
}

function NavLink({ to, icon: Icon, label, current }) {
  const isActive = current === to;
  return (
    <Link to={createPageUrl(to)} className="flex flex-col items-center gap-1">
      <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-100' : ''}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
      </div>
      <span className={`text-xs ${isActive ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{label}</span>
    </Link>
  );
}

function DashboardNavLink({ to, icon: Icon, label, current, onClick }) {
  const isActive = current === to;
  return (
    <Link 
      to={createPageUrl(to)} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
          : 'text-gray-600 hover:bg-emerald-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}