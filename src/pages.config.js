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
import Home from './pages/Home';
import LiveChat from './pages/LiveChat';
import Onboarding from './pages/Onboarding';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import Promos from './pages/Promos';
import RestaurantDetail from './pages/RestaurantDetail';
import RestaurantSetup from './pages/RestaurantSetup';
import RiderDashboard from './pages/RiderDashboard';
import RiderDelivery from './pages/RiderDelivery';
import RiderHome from './pages/RiderHome';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminMessages from './pages/SuperAdminMessages';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminReports from './pages/SuperAdminReports';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminRiders from './pages/SuperAdminRiders';
import SuperAdminSupport from './pages/SuperAdminSupport';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminDrinks from './pages/SuperAdminDrinks';
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
    "Home": Home,
    "LiveChat": LiveChat,
    "Onboarding": Onboarding,
    "OrderConfirmation": OrderConfirmation,
    "OrderHistory": OrderHistory,
    "Promos": Promos,
    "RestaurantDetail": RestaurantDetail,
    "RestaurantSetup": RestaurantSetup,
    "RiderDashboard": RiderDashboard,
    "RiderDelivery": RiderDelivery,
    "RiderHome": RiderHome,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminMessages": SuperAdminMessages,
    "SuperAdminOrders": SuperAdminOrders,
    "SuperAdminReports": SuperAdminReports,
    "SuperAdminRestaurants": SuperAdminRestaurants,
    "SuperAdminRiders": SuperAdminRiders,
    "SuperAdminSupport": SuperAdminSupport,
    "SuperAdminUsers": SuperAdminUsers,
    "SuperAdminDrinks": SuperAdminDrinks,
}

export const pagesConfig = {
    mainPage: "CustomerHome",
    Pages: PAGES,
    Layout: __Layout,
};