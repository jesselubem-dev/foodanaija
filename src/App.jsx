import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './Layout';

import CustomerHome from './pages/CustomerHome';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import CustomerSettings from './pages/CustomerSettings';
import DeleteAccount from './pages/DeleteAccount';
import LiveChat from './pages/LiveChat';
import Profile from './pages/Profile';
import CustomerSupport from './pages/CustomerSupport';

import RestaurantSetup from './pages/RestaurantSetup';
import DashboardHome from './pages/DashboardHome';
import DashboardMenu from './pages/DashboardMenu';
import DashboardOrders from './pages/DashboardOrders';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardSettings from './pages/DashboardSettings';

import RiderHome from './pages/RiderHome';
import RiderDashboard from './pages/RiderDashboard';
import RiderDelivery from './pages/RiderDelivery';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminRiders from './pages/SuperAdminRiders';
import SuperAdminDrinks from './pages/SuperAdminDrinks';
import SuperAdminDrinkOrders from './pages/SuperAdminDrinkOrders';
import SuperAdminCancelledOrders from './pages/SuperAdminCancelledOrders';
import SuperAdminReports from './pages/SuperAdminReports';
import SuperAdminRiderComplaints from './pages/SuperAdminRiderComplaints';
import SuperAdminSupport from './pages/SuperAdminSupport';
import AdminLiveChat from './pages/AdminLiveChat';
import SuperAdminMenuMarketing from './pages/SuperAdminMenuMarketing';
import Chefs from './pages/Chefs';
import SuperAdminChefs from './pages/SuperAdminChefs';
import SuperAdminPromoBanners from './pages/SuperAdminPromoBanners';
import ChefDetail from './pages/ChefDetail';
import ChefSetup from './pages/ChefSetup';

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

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
        <Routes>
          <Route path="*" element={<LayoutWrapper currentPageName="CustomerHome"><CustomerHome /></LayoutWrapper>} />
        </Routes>
      );
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/CustomerHome" replace />} />
      <Route path="/CustomerHome" element={<LayoutWrapper currentPageName="CustomerHome"><CustomerHome /></LayoutWrapper>} />
      <Route path="/Onboarding" element={<LayoutWrapper currentPageName="Onboarding"><Onboarding /></LayoutWrapper>} />
      <Route path="/Home" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
      <Route path="/RestaurantDetail" element={<LayoutWrapper currentPageName="RestaurantDetail"><RestaurantDetail /></LayoutWrapper>} />
      <Route path="/Cart" element={<LayoutWrapper currentPageName="Cart"><Cart /></LayoutWrapper>} />
      <Route path="/Checkout" element={<LayoutWrapper currentPageName="Checkout"><Checkout /></LayoutWrapper>} />
      <Route path="/OrderConfirmation" element={<LayoutWrapper currentPageName="OrderConfirmation"><OrderConfirmation /></LayoutWrapper>} />
      <Route path="/OrderHistory" element={<LayoutWrapper currentPageName="OrderHistory"><OrderHistory /></LayoutWrapper>} />
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App