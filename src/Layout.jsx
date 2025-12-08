import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList, 
  BarChart3, Settings, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  // Dashboard-only layout
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Dashboard Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-emerald-100 z-50 hidden lg:block">
        <div className="p-6">
          <Link to={createPageUrl('DashboardHome')} className="flex items-center gap-2">
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
        <Link to={createPageUrl('DashboardHome')} className="flex items-center gap-2">
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