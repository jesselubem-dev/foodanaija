import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Restaurant": Restaurant,
    "Cart": Cart,
    "Checkout": Checkout,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};