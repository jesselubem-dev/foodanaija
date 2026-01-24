import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Hausa translations
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
  },
  
  ha: {
    // Home Page
    welcome: "Barka da zuwa",
    searchRestaurants: "Nemo gidajen abinci, abinci...",
    allCities: "Duk Garuruwa",
    open: "A BUƊE",
    closed: "A RUFE",
    minOrder: "Mafi ƙaranci",
    delivery: "Isar da kaya",
    reviews: "sharhi",
    
    // Navigation
    home: "Gida",
    promos: "Rangwame",
    cart: "Keken kasuwanci",
    orders: "Oda",
    chat: "Tattaunawa",
    
    // Profile
    profile: "Bayani",
    notifications: "Sanarwa",
    addresses: "Adiresoshi da aka adana",
    support: "Tallafin abokin ciniki",
    logout: "Fita",
    language: "Harshe",
    
    // Cart
    yourCart: "Keken Kasuwanci naku",
    emptyCart: "Keken kasuwanci naku babu komai",
    startBrowsing: "Fara duba gidajen abinci",
    subtotal: "Jimlar",
    deliveryFee: "Kudin isar da kaya",
    total: "Duka",
    proceedToCheckout: "Ci gaba zuwa biyan kuɗi",
    
    // Restaurant Detail
    menu: "Menu",
    about: "Game da",
    reviewsTab: "Sharhi",
    addToCart: "Ƙara zuwa keken kasuwanci",
    unavailable: "Ba a samuwa",
    
    // Orders
    myOrders: "Oda na",
    pending: "Ana jira",
    accepted: "An karɓa",
    delivered: "An kawo",
    cancelled: "An soke",
    
    // Common
    viewMenu: "Duba Menu",
    orderNow: "Oda yanzu",
    loading: "Ana loda...",
    noResults: "Babu sakamako",
    quickActions: "Ayyuka masu sauri",
    orderHistory: "Tarihin Oda",
    viewPastOrders: "Duba oda da suka wuce",
    myCart: "Keken kasuwanci na",
    items: "abubuwa",
    noNotifications: "Babu sanarwa har yanzu",
    
    // Welcome messages
    hi: "Sannu",
    whatToEat: "Me kake so ka ci yau?",
    noRestaurantsFound: "Ba a sami gidajen abinci",
    welcomeToFooda: "Barka da zuwa Fooda",
    preparingExperience: "Muna shirya...",
    
    // Restaurant info
    mins: "mintuna",
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
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const translateText = async (text) => {
    if (!text || language === 'en') return text;
    
    try {
      const cacheKey = `translation_${language}_${text.substring(0, 50)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following text to Hausa language. Only return the translated text, nothing else:\n\n${text}`,
        add_context_from_internet: false,
      });

      sessionStorage.setItem(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
};