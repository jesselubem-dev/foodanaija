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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminUsers from './pages/SuperAdminUsers';
import DeliveryDashboard from './pages/DeliveryDashboard';
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
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminMessages": SuperAdminMessages,
    "SuperAdminOrders": SuperAdminOrders,
    "SuperAdminRestaurants": SuperAdminRestaurants,
    "SuperAdminUsers": SuperAdminUsers,
    "DeliveryDashboard": DeliveryDashboard,
}

export const pagesConfig = {
    mainPage: "RestaurantSetup",
    Pages: PAGES,
    Layout: __Layout,
};