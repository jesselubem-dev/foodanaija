/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminLiveChat from './pages/AdminLiveChat';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomerHome from './pages/CustomerHome';
import CustomerSupport from './pages/CustomerSupport';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardHome from './pages/DashboardHome';
import DashboardMenu from './pages/DashboardMenu';
import DashboardOrders from './pages/DashboardOrders';
import DashboardSettings from './pages/DashboardSettings';
import DeleteAccount from './pages/DeleteAccount';
import Home from './pages/Home';
import LiveChat from './pages/LiveChat';
import Onboarding from './pages/Onboarding';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import Profile from './pages/Profile';
import RestaurantDetail from './pages/RestaurantDetail';
import RestaurantSetup from './pages/RestaurantSetup';
import RiderDashboard from './pages/RiderDashboard';
import RiderDelivery from './pages/RiderDelivery';
import RiderHome from './pages/RiderHome';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminDrinks from './pages/SuperAdminDrinks';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminReports from './pages/SuperAdminReports';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminRiderComplaints from './pages/SuperAdminRiderComplaints';
import SuperAdminRiders from './pages/SuperAdminRiders';
import SuperAdminSupport from './pages/SuperAdminSupport';
import SuperAdminUsers from './pages/SuperAdminUsers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminLiveChat": AdminLiveChat,
    "Cart": Cart,
    "Checkout": Checkout,
    "CustomerHome": CustomerHome,
    "CustomerSupport": CustomerSupport,
    "DashboardAnalytics": DashboardAnalytics,
    "DashboardHome": DashboardHome,
    "DashboardMenu": DashboardMenu,
    "DashboardOrders": DashboardOrders,
    "DashboardSettings": DashboardSettings,
    "DeleteAccount": DeleteAccount,
    "Home": Home,
    "LiveChat": LiveChat,
    "Onboarding": Onboarding,
    "OrderConfirmation": OrderConfirmation,
    "OrderHistory": OrderHistory,
    "Profile": Profile,
    "RestaurantDetail": RestaurantDetail,
    "RestaurantSetup": RestaurantSetup,
    "RiderDashboard": RiderDashboard,
    "RiderDelivery": RiderDelivery,
    "RiderHome": RiderHome,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminDrinks": SuperAdminDrinks,
    "SuperAdminMessages": SuperAdminMessages,
    "SuperAdminOrders": SuperAdminOrders,
    "SuperAdminReports": SuperAdminReports,
    "SuperAdminRestaurants": SuperAdminRestaurants,
    "SuperAdminRiderComplaints": SuperAdminRiderComplaints,
    "SuperAdminRiders": SuperAdminRiders,
    "SuperAdminSupport": SuperAdminSupport,
    "SuperAdminUsers": SuperAdminUsers,
}

export const pagesConfig = {
    mainPage: "CustomerHome",
    Pages: PAGES,
    Layout: __Layout,
};