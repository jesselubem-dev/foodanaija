import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomerHome from './pages/CustomerHome';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardHome from './pages/DashboardHome';
import DashboardMenu from './pages/DashboardMenu';
import DashboardOrders from './pages/DashboardOrders';
import DashboardSettings from './pages/DashboardSettings';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import RestaurantDetail from './pages/RestaurantDetail';
import RestaurantSetup from './pages/RestaurantSetup';
import RiderDashboard from './pages/RiderDashboard';
import RiderLogin from './pages/RiderLogin';
import RiderOrders from './pages/RiderOrders';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminRiders from './pages/SuperAdminRiders';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Cart": Cart,
    "Checkout": Checkout,
    "CustomerHome": CustomerHome,
    "DashboardAnalytics": DashboardAnalytics,
    "DashboardHome": DashboardHome,
    "DashboardMenu": DashboardMenu,
    "DashboardOrders": DashboardOrders,
    "DashboardSettings": DashboardSettings,
    "Home": Home,
    "Onboarding": Onboarding,
    "OrderConfirmation": OrderConfirmation,
    "OrderHistory": OrderHistory,
    "RestaurantDetail": RestaurantDetail,
    "RestaurantSetup": RestaurantSetup,
    "RiderDashboard": RiderDashboard,
    "RiderLogin": RiderLogin,
    "RiderOrders": RiderOrders,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminMessages": SuperAdminMessages,
    "SuperAdminOrders": SuperAdminOrders,
    "SuperAdminRestaurants": SuperAdminRestaurants,
    "SuperAdminUsers": SuperAdminUsers,
    "SuperAdminRiders": SuperAdminRiders,
}

export const pagesConfig = {
    mainPage: "RestaurantSetup",
    Pages: PAGES,
    Layout: __Layout,
};