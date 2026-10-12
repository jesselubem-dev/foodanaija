import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import UpdatePrompt from '@/components/UpdatePrompt'
import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './Layout';

import CustomerHome from './pages/CustomerHome';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
const Home = lazy(() => import('./pages/Home'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CustomerSettings = lazy(() => import('./pages/CustomerSettings'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const Profile = lazy(() => import('./pages/Profile'));
const CustomerSupport = lazy(() => import('./pages/CustomerSupport'));

const RestaurantSetup = lazy(() => import('./pages/RestaurantSetup'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const DashboardMenu = lazy(() => import('./pages/DashboardMenu'));
const DashboardOrders = lazy(() => import('./pages/DashboardOrders'));
const DashboardAnalytics = lazy(() => import('./pages/DashboardAnalytics'));
const DashboardSettings = lazy(() => import('./pages/DashboardSettings'));

const RiderHome = lazy(() => import('./pages/RiderHome'));
const RiderDashboard = lazy(() => import('./pages/RiderDashboard'));
const RiderDelivery = lazy(() => import('./pages/RiderDelivery'));

const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminRestaurants = lazy(() => import('./pages/SuperAdminRestaurants'));
const SuperAdminOrders = lazy(() => import('./pages/SuperAdminOrders'));
const SuperAdminUsers = lazy(() => import('./pages/SuperAdminUsers'));
const SuperAdminMessages = lazy(() => import('./pages/SuperAdminMessages'));
const SuperAdminRiders = lazy(() => import('./pages/SuperAdminRiders'));
const SuperAdminDrinks = lazy(() => import('./pages/SuperAdminDrinks'));
const SuperAdminDrinkOrders = lazy(() => import('./pages/SuperAdminDrinkOrders'));
const SuperAdminCancelledOrders = lazy(() => import('./pages/SuperAdminCancelledOrders'));
const SuperAdminReports = lazy(() => import('./pages/SuperAdminReports'));
const SuperAdminRiderComplaints = lazy(() => import('./pages/SuperAdminRiderComplaints'));
const SuperAdminSupport = lazy(() => import('./pages/SuperAdminSupport'));
const AdminLiveChat = lazy(() => import('./pages/AdminLiveChat'));
const SuperAdminMenuMarketing = lazy(() => import('./pages/SuperAdminMenuMarketing'));
const Chefs = lazy(() => import('./pages/Chefs'));
const SuperAdminChefs = lazy(() => import('./pages/SuperAdminChefs'));
const SuperAdminPromoBanners = lazy(() => import('./pages/SuperAdminPromoBanners'));
const SuperAdminAllMenus = lazy(() => import('./pages/SuperAdminAllMenus'));
const SuperAdminPromoCode = lazy(() => import('./pages/SuperAdminPromoCode'));
const SuperAdminFeeSettings = lazy(() => import('./pages/SuperAdminFeeSettings'));
const SuperAdminRefundedOrders = lazy(() => import('./pages/SuperAdminRefundedOrders'));
const SuperAdminBroadcast = lazy(() => import('./pages/SuperAdminBroadcast'));
const ChefDetail = lazy(() => import('./pages/ChefDetail'));
const ChefSetup = lazy(() => import('./pages/ChefSetup'));

// Shown for a split second while a screen's code downloads the first time
const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div className="w-7 h-7 border-[3px] border-gray-200 border-t-[#F5B700] rounded-full animate-spin" />
  </div>
);

// Download the screens customers open most, in the background, right after start-up,
// so tapping into them is instant.
const prefetchCustomerScreens = () => {
  const run = () => [
    () => import('./pages/RestaurantDetail'), () => import('./pages/Cart'), () => import('./pages/Checkout'),
    () => import('./pages/OrderHistory'), () => import('./pages/CustomerSettings'), () => import('./pages/Notifications'),
    () => import('./pages/OrderConfirmation'), () => import('./pages/Profile'), () => import('./pages/Chefs'),
  ].forEach((load, i) => setTimeout(() => load().catch(() => {}), i * 150));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
};

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // The login screen never needs to wait for the "who is logged in" check
  if (typeof window !== 'undefined' && window.location.pathname === '/Login') {
    return <Login />;
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="*" element={<LayoutWrapper currentPageName="CustomerHome"><CustomerHome /></LayoutWrapper>} />
        </Routes>
        </Suspense>
      );
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Navigate to="/CustomerHome" replace />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/CustomerHome" element={<LayoutWrapper currentPageName="CustomerHome"><CustomerHome /></LayoutWrapper>} />
      <Route path="/Onboarding" element={<LayoutWrapper currentPageName="Onboarding"><Onboarding /></LayoutWrapper>} />
      <Route path="/Home" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
      <Route path="/RestaurantDetail" element={<LayoutWrapper currentPageName="RestaurantDetail"><RestaurantDetail /></LayoutWrapper>} />
      <Route path="/Cart" element={<LayoutWrapper currentPageName="Cart"><Cart /></LayoutWrapper>} />
      <Route path="/Checkout" element={<LayoutWrapper currentPageName="Checkout"><Checkout /></LayoutWrapper>} />
      <Route path="/OrderConfirmation" element={<LayoutWrapper currentPageName="OrderConfirmation"><OrderConfirmation /></LayoutWrapper>} />
      <Route path="/OrderHistory" element={<LayoutWrapper currentPageName="OrderHistory"><OrderHistory /></LayoutWrapper>} />
      <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/CustomerSettings" element={<LayoutWrapper currentPageName="CustomerSettings"><CustomerSettings /></LayoutWrapper>} />
      <Route path="/DeleteAccount" element={<LayoutWrapper currentPageName="DeleteAccount"><DeleteAccount /></LayoutWrapper>} />
      <Route path="/LiveChat" element={<LayoutWrapper currentPageName="LiveChat"><LiveChat /></LayoutWrapper>} />
      <Route path="/Profile" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/CustomerSupport" element={<LayoutWrapper currentPageName="CustomerSupport"><CustomerSupport /></LayoutWrapper>} />
      <Route path="/RestaurantSetup" element={<LayoutWrapper currentPageName="RestaurantSetup"><RestaurantSetup /></LayoutWrapper>} />
      <Route path="/DashboardHome" element={<LayoutWrapper currentPageName="DashboardHome"><DashboardHome /></LayoutWrapper>} />
      <Route path="/DashboardMenu" element={<LayoutWrapper currentPageName="DashboardMenu"><DashboardMenu /></LayoutWrapper>} />
      <Route path="/DashboardOrders" element={<LayoutWrapper currentPageName="DashboardOrders"><DashboardOrders /></LayoutWrapper>} />
      <Route path="/DashboardAnalytics" element={<LayoutWrapper currentPageName="DashboardAnalytics"><DashboardAnalytics /></LayoutWrapper>} />
      <Route path="/DashboardSettings" element={<LayoutWrapper currentPageName="DashboardSettings"><DashboardSettings /></LayoutWrapper>} />
      <Route path="/RiderHome" element={<LayoutWrapper currentPageName="RiderHome"><RiderHome /></LayoutWrapper>} />
      <Route path="/RiderDashboard" element={<LayoutWrapper currentPageName="RiderDashboard"><RiderDashboard /></LayoutWrapper>} />
      <Route path="/RiderDelivery" element={<LayoutWrapper currentPageName="RiderDelivery"><RiderDelivery /></LayoutWrapper>} />
      <Route path="/SuperAdminDashboard" element={<LayoutWrapper currentPageName="SuperAdminDashboard"><SuperAdminDashboard /></LayoutWrapper>} />
      <Route path="/SuperAdminRestaurants" element={<LayoutWrapper currentPageName="SuperAdminRestaurants"><SuperAdminRestaurants /></LayoutWrapper>} />
      <Route path="/SuperAdminOrders" element={<LayoutWrapper currentPageName="SuperAdminOrders"><SuperAdminOrders /></LayoutWrapper>} />
      <Route path="/SuperAdminUsers" element={<LayoutWrapper currentPageName="SuperAdminUsers"><SuperAdminUsers /></LayoutWrapper>} />
      <Route path="/SuperAdminMessages" element={<LayoutWrapper currentPageName="SuperAdminMessages"><SuperAdminMessages /></LayoutWrapper>} />
      <Route path="/SuperAdminRiders" element={<LayoutWrapper currentPageName="SuperAdminRiders"><SuperAdminRiders /></LayoutWrapper>} />
      <Route path="/SuperAdminDrinks" element={<LayoutWrapper currentPageName="SuperAdminDrinks"><SuperAdminDrinks /></LayoutWrapper>} />
      <Route path="/SuperAdminDrinkOrders" element={<LayoutWrapper currentPageName="SuperAdminDrinkOrders"><SuperAdminDrinkOrders /></LayoutWrapper>} />
      <Route path="/SuperAdminCancelledOrders" element={<LayoutWrapper currentPageName="SuperAdminCancelledOrders"><SuperAdminCancelledOrders /></LayoutWrapper>} />
      <Route path="/SuperAdminReports" element={<LayoutWrapper currentPageName="SuperAdminReports"><SuperAdminReports /></LayoutWrapper>} />
      <Route path="/SuperAdminRiderComplaints" element={<LayoutWrapper currentPageName="SuperAdminRiderComplaints"><SuperAdminRiderComplaints /></LayoutWrapper>} />
      <Route path="/SuperAdminSupport" element={<LayoutWrapper currentPageName="SuperAdminSupport"><SuperAdminSupport /></LayoutWrapper>} />
      <Route path="/AdminLiveChat" element={<LayoutWrapper currentPageName="AdminLiveChat"><AdminLiveChat /></LayoutWrapper>} />
      <Route path="/SuperAdminMenuMarketing" element={<LayoutWrapper currentPageName="SuperAdminMenuMarketing"><SuperAdminMenuMarketing /></LayoutWrapper>} />
      <Route path="/Chefs" element={<LayoutWrapper currentPageName="Chefs"><Chefs /></LayoutWrapper>} />
      <Route path="/ChefDetail" element={<LayoutWrapper currentPageName="ChefDetail"><ChefDetail /></LayoutWrapper>} />
      <Route path="/ChefSetup" element={<LayoutWrapper currentPageName="ChefSetup"><ChefSetup /></LayoutWrapper>} />
      <Route path="/SuperAdminChefs" element={<LayoutWrapper currentPageName="SuperAdminChefs"><SuperAdminChefs /></LayoutWrapper>} />
      <Route path="/SuperAdminPromoBanners" element={<LayoutWrapper currentPageName="SuperAdminPromoBanners"><SuperAdminPromoBanners /></LayoutWrapper>} />
      <Route path="/SuperAdminAllMenus" element={<LayoutWrapper currentPageName="SuperAdminAllMenus"><SuperAdminAllMenus /></LayoutWrapper>} />
      <Route path="/SuperAdminPromoCode" element={<LayoutWrapper currentPageName="SuperAdminPromoCode"><SuperAdminPromoCode /></LayoutWrapper>} />
      <Route path="/SuperAdminFeeSettings" element={<LayoutWrapper currentPageName="SuperAdminFeeSettings"><SuperAdminFeeSettings /></LayoutWrapper>} />
      <Route path="/SuperAdminRefundedOrders" element={<LayoutWrapper currentPageName="SuperAdminRefundedOrders"><SuperAdminRefundedOrders /></LayoutWrapper>} />
      <Route path="/SuperAdminBroadcast" element={<LayoutWrapper currentPageName="SuperAdminBroadcast"><SuperAdminBroadcast /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {

  useEffect(() => { prefetchCustomerScreens(); }, []);

  // Keep the phone's status-bar colour in step with the app's light/dark theme
  useEffect(() => {
    const sync = () => {
      const cls = document.documentElement.classList;
      const color = cls.contains('gold-top') ? '#F5B700' : cls.contains('dark') ? '#131211' : '#ffffff';
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
        {/* Solid strip behind the phone's clock and battery so content never scrolls under them */}
        <div className="status-shield" aria-hidden="true" />
        <UpdatePrompt />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App