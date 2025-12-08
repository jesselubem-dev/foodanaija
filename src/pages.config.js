import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Search from './pages/Search';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Restaurant": Restaurant,
    "Cart": Cart,
    "Checkout": Checkout,
    "Orders": Orders,
    "Profile": Profile,
    "Search": Search,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};