import React, { createContext, useContext } from 'react';

const translations = {
  en: {
    // Home Page
    welcome: "Welcome",
    searchRestaurants: "Search restaurants, dishes...",
    allCities: "All Cities",
    open: "OPEN",
    closed: "CLOSED",
    minOrder: "Min",
    delivery: "Delivery",
    reviews: "reviews",
    
    // Navigation
    home: "Home",
    promos: "Promos",
    cart: "Cart",
    orders: "Orders",
    chat: "Chat",
    
    // Profile
    profile: "Profile",
    notifications: "Notifications",
    addresses: "Saved Addresses",
    support: "Customer Support",
    logout: "Logout",
    language: "Language",
    
    // Cart
    yourCart: "Your Cart",
    emptyCart: "Your cart is empty",
    startBrowsing: "Start browsing restaurants",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    total: "Total",
    proceedToCheckout: "Proceed to Checkout",
    
    // Restaurant Detail
    menu: "Menu",
    about: "About",
    reviewsTab: "Reviews",
    addToCart: "Add to Cart",
    unavailable: "Unavailable",
    
    // Orders
    myOrders: "My Orders",
    pending: "Pending",
    accepted: "Accepted",
    delivered: "Delivered",
    cancelled: "Cancelled",
    
    // Common
    viewMenu: "View Menu",
    orderNow: "Order Now",
    loading: "Loading...",
    noResults: "No results found",
    quickActions: "Quick Actions",
    orderHistory: "Order History",
    viewPastOrders: "View past orders",
    myCart: "My Cart",
    items: "items",
    noNotifications: "No notifications yet",
    
    // Welcome messages
    hi: "Hi",
    whatToEat: "What would you like to eat today?",
    noRestaurantsFound: "No restaurants found",
    welcomeToFooda: "Welcome to Fooda",
    preparingExperience: "Preparing your experience...",
    
    // Restaurant info
    mins: "mins",
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const t = (key) => {
    return translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: 'en', t }}>
      {children}
    </LanguageContext.Provider>
  );
};