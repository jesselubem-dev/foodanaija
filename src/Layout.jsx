import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList, 
  BarChart3, Settings, Menu, X, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import NoInternet from './components/NoInternet';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
  const noLayoutPages = ['SuperAdminDashboard', 'SuperAdminRestaurants', 'SuperAdminUsers', 'SuperAdminOrders', 'SuperAdminMessages', 'SuperAdminRiders', 'SuperAdminDrinks', 'SuperAdminDrinkOrders', 'SuperAdminCancelledOrders', 'SuperAdminReports', 'SuperAdminRiderComplaints', 'AdminLiveChat', 'LiveChat', 'Home', 'Onboarding', 'CustomerHome', 'RestaurantDetail', 'Cart', 'Checkout', 'OrderConfirmation', 'OrderHistory', 'DeleteAccount', 'RiderHome', 'RiderDashboard', 'RiderDelivery', 'PaymentVerification', 'CustomerSettings'];
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Allow RestaurantSetup page to render without restaurant
  if (!restaurant && currentPageName !== 'RestaurantSetup') {
    // If user is loaded but has no restaurant, show sign in / get started page
    if (user !== null) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png"
              alt="Fooda Naija"
              className="h-16 w-auto object-contain mx-auto mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Restaurant Found</h2>
            <p className="text-gray-500 text-sm mb-6">You don't have a restaurant registered yet. Set one up to access your dashboard.</p>
            <a
              href={createPageUrl('RestaurantSetup')}
              className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl mb-3 hover:opacity-90 transition-opacity"
            >
              Register Your Restaurant
            </a>
            <button
              onClick={() => base44.auth.logout()}
              className="block w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-2"
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }
    // Still loading user
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
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
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png" 
              alt="Fooda Naija" 
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>
        
        <nav className="px-4 space-y-1">
          <DashboardNavLink to="DashboardHome" icon={LayoutDashboard} label="Dashboard" current={currentPageName} />
          <DashboardNavLink to="DashboardMenu" icon={UtensilsCrossed} label="Menu" current={currentPageName} />
          <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} restaurant={restaurant} />
          <DashboardNavLink to="DashboardAnalytics" icon={BarChart3} label="Analytics" current={currentPageName} />
          <DashboardNavLink to="DashboardSettings" icon={Settings} label="Settings" current={currentPageName} />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-orange-100 bg-white/80 p-4 space-y-3">
          {/* Contact Support */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Need Help?</p>
            <p className="text-xs text-blue-600">
              📧 <a href="mailto:support@foodanaija.com" className="hover:underline">support@foodanaija.com</a>
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              📞 <a href="tel:090333455557" className="hover:underline">090333455557</a>
            </p>
          </div>

          {/* Restaurant profile + logout */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <ChefHat className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{restaurant.name}</p>
              <p className="text-xs text-gray-500 truncate">{restaurant.city}</p>
            </div>
            <button
              onClick={() => base44.auth.logout()}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header for Dashboard */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50 px-4 flex items-center justify-between">
        <Link to={createPageUrl('DashboardHome')} className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png" 
            alt="Fooda Naija" 
            className="h-10 w-auto object-contain"
          />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-16 bottom-0 w-64 bg-white p-4 space-y-1 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex-1 space-y-1">
                <DashboardNavLink to="DashboardHome" icon={LayoutDashboard} label="Dashboard" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
                <DashboardNavLink to="DashboardMenu" icon={UtensilsCrossed} label="Menu" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
                <DashboardNavLink to="DashboardOrders" icon={ClipboardList} label="Orders" current={currentPageName} onClick={() => setMobileMenuOpen(false)} restaurant={restaurant} />
                <DashboardNavLink to="DashboardAnalytics" icon={BarChart3} label="Analytics" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
                <DashboardNavLink to="DashboardSettings" icon={Settings} label="Settings" current={currentPageName} onClick={() => setMobileMenuOpen(false)} />
              </div>
              <div className="border-t border-orange-100 pt-3 space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Need Help?</p>
                  <p className="text-xs text-blue-600">📧 support@foodanaija.com</p>
                  <p className="text-xs text-blue-600 mt-0.5">📞 090333455557</p>
                </div>
                <button
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
        </div>
      )}

      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
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
          const pending = orders.filter(o => o.status === 'pending');
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