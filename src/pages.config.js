import Home from './pages/Home';
import Search from './pages/Search';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Search": Search,
    "Restaurant": Restaurant,
    "Cart": Cart,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};