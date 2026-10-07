import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, ChefHat, ChevronRight } from 'lucide-react';
import BottomNav from '../components/customer/BottomNav';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

import NotificationBell from '../components/customer/NotificationBell';
import PromoModal from '../components/customer/PromoModal';
import VoiceOrderModal from '../components/customer/VoiceOrderModal';
import RiderRatingModal, { hasSkippedRiderRating } from '../components/customer/RiderRatingModal';
import FloatingCart from '../components/customer/FloatingCart';
import FloatingWhatsApp from '../components/customer/FloatingWhatsApp';
import HomePromoCard from '../components/customer/HomePromoCard';
import RamadanBanner from '../components/customer/RamadanBanner';
import NoInternet from '../components/NoInternet';
import ErrorBoundary from '../components/ErrorBoundary';
import { LanguageProvider } from '../components/LanguageContext';
import { StaggerItem } from '@/components/ui/motion';


function CustomerHomeContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [showVoiceOrder, setShowVoiceOrder] = useState(false);
  const [riderRatingOrder, setRiderRatingOrder] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const checkDeliveredOrders = async () => {
      try {
        const userOrders = await base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 5);
        const deliveredOrder = userOrders.find(o => o.delivery_status === 'delivered');
        if (deliveredOrder && deliveredOrder.rider_id && !hasSkippedRiderRating(deliveredOrder.id)) {
          const existingRating = await base44.entities.RiderRating.filter({ order_id: deliveredOrder.id, customer_email: user.email });
          if (existingRating.length === 0) setRiderRatingOrder(deliveredOrder);
        }
      } catch {}
    };
    checkDeliveredOrders();
    const interval = setInterval(checkDeliveredOrders, 10000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const onboardingDone = localStorage.getItem('onboarding_completed');
      if (!onboardingDone) { window.location.href = createPageUrl('Onboarding'); return; }
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      setUser(null);
    }
  };

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['approved-restaurants'],
    queryFn: async () => {
      try {
        return await base44.entities.Restaurant.filter({ is_approved: true });
      } catch {
        const res = await base44.functions.invoke('getPublicRestaurants', {});
        return res.data;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: promoItems = [] } = useQuery({
    queryKey: ['promo-items'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ is_promo: true, is_available: true });
      const now = new Date();
      return items.map(item => ({ ...item, restaurant: restaurants.find(r => r.id === item.restaurant_id) }))
        .filter(item => {
          if (!item.restaurant?.is_approved || !item.restaurant?.is_open) return false;
          if (!item.promo_end_date) return true;
          return now <= new Date(item.promo_end_date);
        });
    },
    enabled: restaurants.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const chatId = localStorage.getItem(`chat_id_${user.email}`);
      if (!chatId) return [];
      return await base44.entities.ChatMessage.filter({ chat_id: chatId, is_read: false }, '-created_date', 10);
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
    staleTime: 20000,
    refetchOnWindowFocus: false,
  });

  const unreadChatCount = chatMessages.filter(msg => (msg.sender_type === 'admin' || msg.sender_type === 'ai') && !msg.is_read).length;

  useEffect(() => {
    if (user && !sessionStorage.getItem('promo_shown')) {
      setTimeout(() => { setShowPromo(true); sessionStorage.setItem('promo_shown', 'true'); }, 1200);
    }
  }, [user]);

  const isRestaurantOpen = (restaurant) => {
    if (!restaurant.is_open) return false;
    if (!restaurant.opening_time || !restaurant.closing_time) return restaurant.is_open;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = restaurant.opening_time.split(':').map(Number);
    const [ch, cm] = restaurant.closing_time.split(':').map(Number);
    const open = oh * 60 + om, close = ch * 60 + cm;
    return close < open ? (cur >= open || cur <= close) : (cur >= open && cur <= close);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.full_name || '').trim().split(' ')[0];

  const term = searchTerm.trim().toLowerCase();
  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch = !term ||
        (r.name || '').toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.cuisine_types?.some(c => c.toLowerCase().includes(term));
      return matchesSearch;
    })
    // Open restaurants first, then by rating
    .sort((a, b) => (Number(isRestaurantOpen(b)) - Number(isRestaurantOpen(a))) ||
      (b.rating || 0) - (a.rating || 0) || (b.total_reviews || 0) - (a.total_reviews || 0));


  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) { removeFromCart(itemId); return; }
    const newCart = cart.map(i => i.item_id === itemId ? { ...i, quantity: newQuantity } : i);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(i => i.item_id !== itemId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success('Item removed from cart');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <NoInternet />

        {/* Header */}
        <div className="bg-white px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-fooda-red leading-tight">
                  {greeting}{firstName ? `, ${firstName}` : ''}
                </p>
                <h1 className="text-[20px] font-semibold text-gray-900 leading-snug mt-0.5">
                  What are you craving today?
                </h1>
              </div>
              <div className="flex items-center flex-shrink-0">
                {user ? (
                  <NotificationBell userEmail={user.email} />
                ) : (
                  <button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="bg-fooda-gold text-[#111111] font-semibold text-sm px-4 py-2 rounded-lg press"
                  >
                    Log In
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 pointer-events-none" />
              <Input
                placeholder="Search restaurants, dishes, or cuisines"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-[14px] border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-1 pb-28 lg:pb-8">

          {!term && (
            <>
              {/* Promo card (live promo code) */}
              <HomePromoCard />

              {/* Book a Chef */}
              <Link to={createPageUrl('Chefs')} className="block mb-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3 flex items-center gap-3 press-card">
                  <div className="w-11 h-11 rounded-xl bg-fooda-gold flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-5 h-5 f-on-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-gray-900 leading-tight">Book a Personal Chef</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">Describe your meal, a chef cooks it for you</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            </>
          )}

          {/* Restaurants */}
          {restaurantsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-[150px] bg-gray-100" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No restaurants found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant, idx) => {
                const isOpen = isRestaurantOpen(restaurant);
                const subtitle = restaurant.description || restaurant.cuisine_types?.slice(0, 3).join(' · ') || '';
                const content = (
                  <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${isOpen ? 'press-card' : 'opacity-60'}`}>
                    <div className="relative">
                      {restaurant.cover_image_url ? (
                        <img
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          loading="lazy"
                          className={`w-full h-[150px] object-cover ${!isOpen ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className={`w-full h-[150px] f-tint-gold ${!isOpen ? 'grayscale' : ''}`} />
                      )}
                      {!isOpen && (
                        <span
                          className="absolute top-2.5 right-2.5 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm f-float"
                        >
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="px-3.5 py-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-[17px] leading-tight truncate">{restaurant.name}</h3>
                        {subtitle && (
                          <p className="text-[13px] text-gray-500 mt-1 truncate">{subtitle}</p>
                        )}
                        <div className="flex items-center gap-5 mt-1.5 text-[12px] text-gray-700">
                          <span>Delivery ₦{Number(restaurant.delivery_fee || 0).toLocaleString()}</span>
                          <span>{restaurant.delivery_time || '30-45 mins'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                );

                return (
                  <StaggerItem key={restaurant.id} index={idx}>
                    {isOpen ? (
                      <Link
                        to={user ? createPageUrl(`RestaurantDetail?id=${restaurant.id}`) : '#'}
                        onClick={!user ? (e) => { e.preventDefault(); base44.auth.redirectToLogin(window.location.href); } : undefined}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div aria-disabled="true">{content}</div>
                    )}
                  </StaggerItem>
                );
              })}
            </div>
          )}
        </div>

        {/* Promo Modal */}
        {showPromo && (
          <PromoModal promoItems={promoItems} onClose={() => setShowPromo(false)} />
        )}

        <VoiceOrderModal isOpen={showVoiceOrder} onClose={() => setShowVoiceOrder(false)} restaurants={restaurants} onAddToCart={() => {}} />

        {riderRatingOrder && <RiderRatingModal order={riderRatingOrder} onClose={() => setRiderRatingOrder(null)} />}

        <FloatingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQuantity={updateCartQuantity} onRemoveItem={removeFromCart} />
        <RamadanBanner />
        <FloatingWhatsApp />
        <BottomNav currentPage="CustomerHome" unreadChatCount={unreadChatCount} user={user} />
      </div>
    </ErrorBoundary>
  );
}

export default function CustomerHome() {
  return (
    <LanguageProvider>
      <CustomerHomeContent />
    </LanguageProvider>
  );
}