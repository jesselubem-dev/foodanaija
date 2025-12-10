import RestaurantSetup from './pages/RestaurantSetup';
import DashboardHome from './pages/DashboardHome';
import DashboardMenu from './pages/DashboardMenu';
import DashboardOrders from './pages/DashboardOrders';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardSettings from './pages/DashboardSettings';
import Home from './pages/Home';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminMessages from './pages/SuperAdminMessages';
import CustomerHome from './pages/CustomerHome';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "RestaurantSetup": RestaurantSetup,
    "DashboardHome": DashboardHome,
    "DashboardMenu": DashboardMenu,
    "DashboardOrders": DashboardOrders,
    "DashboardAnalytics": DashboardAnalytics,
    "DashboardSettings": DashboardSettings,
    "Home": Home,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminRestaurants": SuperAdminRestaurants,
    "SuperAdminUsers": SuperAdminUsers,
    "SuperAdminOrders": SuperAdminOrders,
    "SuperAdminMessages": SuperAdminMessages,
    "CustomerHome": CustomerHome,
    "RestaurantDetail": RestaurantDetail,
    "Cart": Cart,
    "Checkout": Checkout,
    "OrderConfirmation": OrderConfirmation,
}

export const pagesConfig = {
    mainPage: "RestaurantSetup",
    Pages: PAGES,
    Layout: __Layout,
};