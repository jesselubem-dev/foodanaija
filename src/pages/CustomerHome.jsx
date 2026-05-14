import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Star, Clock, ChefHat, MapPin, Bike } from 'lucide-react';
import BottomNav from '../components/customer/BottomNav';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

import NotificationBell from '../components/customer/NotificationBell';
import PromoModal from '../components/customer/PromoModal';
import VoiceOrderModal from '../components/customer/VoiceOrderModal';
import RiderRatingModal from '../components/customer/RiderRatingModal';
import FloatingCart from '../components/customer/FloatingCart';
import RamadanBanner from '../components/customer/RamadanBanner';
import NoInternet from '../components/NoInternet';
import ErrorBoundary from '../components/ErrorBoundary';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';

function CustomerHomeContent() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
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
        if (deliveredOrder && deliveredOrder.rider_id) {
          const existingRating = await base44.entities.RiderRating.filter({ order_id: deliveredOrder.id, customer_email: user.email });
          if (existingRating.length === 0) setRiderRatingOrder(deliveredOrder);
        }
      } catch {}
    };
    checkDeliveredOrders();
    const interval = setInterval(checkDeliveredOrders, 10000);
    return () => clearInterval(interval);
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const checkNewNotifications = async () => {
      try {
        const notifications = await base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 5);
        const recent = notifications.filter(n => (Date.now() - new Date(n.created_date).getTime()) < 60000);
        recent.forEach(async notification => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png',
              tag: notification.id,
            });
          }
          toast.success(notification.message, { duration: 8000, position: 'top-center' });
          setTimeout(() => base44.entities.Notification.update(notification.id, { is_read: true }), 2000);
        });
      } catch {}
    };
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
    if (user && promoItems.length > 0 && !sessionStorage.getItem('promo_shown')) {
      setTimeout(() => { setShowPromo(true); sessionStorage.setItem('promo_shown', 'true'); }, 1200);
    }
  }, [user, promoItems]);

  const cities = ['Sokoto'];
  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch && (selectedCity === 'all' || r.city === selectedCity);
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.total_reviews || 0) - (a.total_reviews || 0));

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      <div className="min-h-screen bg-[#F8F7F5]">
        <NoInternet />

        {/* Header */}
        <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-orange-500 uppercase tracking-widest mb-0.5">Good day!</p>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {user ? `Hi, ${(user.full_name || '').split(' ')[0]} 👋` : 'Welcome to Fooda'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">What are you craving today?</p>
            </div>
            <div className="flex items-center gap-2">
              {user && <NotificationBell user={user} />}
              {!user && (
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="bg-orange-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-md shadow-orange-200"
                >
                  Log In
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search restaurants, dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 lg:pb-6">

          {/* Book a Chef Banner */}
          <Link to={createPageUrl('Chefs')} className="block mb-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4">
              <div className="absolute right-0 top-0 w-32 h-full opacity-20">
                <div className="w-32 h-32 bg-white rounded-full -translate-y-8 translate-x-8"></div>
              </div>
              <div className="flex items-center gap-3 relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <p className="font-bold text-base leading-tight">Book a Personal Chef</p>
                  <p className="text-xs text-white/80 mt-0.5">Describe your meal, a chef cooks it for you</p>
                </div>
                <div className="ml-auto text-white/80 text-lg font-light">›</div>
              </div>
            </div>
          </Link>

          {/* City Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
            {['all', ...cities].map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCity === city
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {city === 'all' ? 'All Cities' : city}
              </button>
            ))}
          </div>

          {/* Section Header */}
          {!searchTerm && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Restaurants Near You</h2>
              <span className="text-sm text-gray-400">{filteredRestaurants.length} places</span>
            </div>
          )}

          {/* Restaurants */}
          {restaurantsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2">
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
              <p className="text-gray-400 text-sm mt-1">Try a different search or city</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant) => {
                const isOpen = isRestaurantOpen(restaurant);
                const content = (
                  <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 ${isOpen ? 'active:scale-[0.98] transition-transform' : 'opacity-70'}`}>
                    <div className="relative">
                      {restaurant.cover_image_url ? (
                        <img src={restaurant.cover_image_url} alt="" className={`w-full h-48 object-cover ${!isOpen ? 'grayscale' : ''}`} />
                      ) : (
                        <div className={`w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 ${!isOpen ? 'grayscale' : ''}`} />
                      )}
                      <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${isOpen ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`}>
                        {isOpen ? '● Open' : '● Closed'}
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-gray-800">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{restaurant.name}</h3>
                          {restaurant.cuisine_types?.length > 0 && (
                            <p className="text-sm text-gray-400 mt-0.5">{restaurant.cuisine_types.slice(0, 2).join(' · ')}</p>
                          )}
                        </div>
                        {restaurant.logo_url && (
                          <img src={restaurant.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>5–15 min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />
                          <span>₦800 delivery</span>
                        </div>
                        {restaurant.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{restaurant.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return isOpen ? (
                  <Link
                    key={restaurant.id}
                    to={user ? createPageUrl(`RestaurantDetail?id=${restaurant.id}`) : '#'}
                    onClick={!user ? (e) => { e.preventDefault(); base44.auth.redirectToLogin(window.location.href); } : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={restaurant.id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promo Modal */}
        {showPromo && promoItems.length > 0 && (
          <PromoModal promoItems={promoItems} onClose={() => setShowPromo(false)} />
        )}

        <VoiceOrderModal isOpen={showVoiceOrder} onClose={() => setShowVoiceOrder(false)} restaurants={restaurants} onAddToCart={() => {}} />

        {riderRatingOrder && <RiderRatingModal order={riderRatingOrder} onClose={() => setRiderRatingOrder(null)} />}

        <FloatingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onUpdateQuantity={updateCartQuantity} onRemoveItem={removeFromCart} />
        <RamadanBanner />
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