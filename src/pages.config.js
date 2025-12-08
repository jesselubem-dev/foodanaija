import RestaurantSetup from './pages/RestaurantSetup';
import DashboardHome from './pages/DashboardHome';
import DashboardMenu from './pages/DashboardMenu';
import DashboardOrders from './pages/DashboardOrders';
import DashboardAnalytics from './pages/DashboardAnalytics';
import DashboardSettings from './pages/DashboardSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "RestaurantSetup": RestaurantSetup,
    "DashboardHome": DashboardHome,
    "DashboardMenu": DashboardMenu,
    "DashboardOrders": DashboardOrders,
    "DashboardAnalytics": DashboardAnalytics,
    "DashboardSettings": DashboardSettings,
}

export const pagesConfig = {
    mainPage: "RestaurantSetup",
    Pages: PAGES,
    Layout: __Layout,
};