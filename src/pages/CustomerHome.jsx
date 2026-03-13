import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Star, Bike, ShoppingBag, Bell, Settings
} from 'lucide-react';
import BottomNav from '../components/customer/BottomNav';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import NotificationBell from '../components/customer/NotificationBell';
import PromoModal from '../components/customer/PromoModal';
import BannerCarousel from '../components/customer/BannerCarousel';
import VoiceOrderModal from '../components/customer/VoiceOrderModal';
import RiderRatingModal from '../components/customer/RiderRatingModal';
import FloatingCart from '../components/customer/FloatingCart';
import RamadanBanner from '../components/customer/RamadanBanner';
import NoInternet from '../components/NoInternet';
import ErrorBoundary from '../components/ErrorBoundary';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';

function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full animate-pulse opacity-30"></div>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png" 
            alt="Fooda Naija" 
            className="relative w-32 h-32 object-contain animate-bounce"
          />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-xl font-bold text-gray-800 mb-1">{t('welcomeToFooda')}</p>
        <p className="text-sm text-gray-500">{t('preparingExperience')}</p>
      </div>
    </div>
  );
}

function CustomerHomeContent() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [showVoiceOrder, setShowVoiceOrder] = useState(false);
  const [riderRatingOrder, setRiderRatingOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPosition, setCartPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Show loader only on first visit
    const hasSeenLoader = sessionStorage.getItem('home_loader_seen');
    if (!hasSeenLoader) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('home_loader_seen', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for delivered orders and show rating modal
  useEffect(() => {
    if (!user?.email) return;

    const checkDeliveredOrders = async () => {
      try {
        const userOrders = await base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 5);
        const deliveredOrder = userOrders.find(o => o.delivery_status === 'delivered');
        
        if (deliveredOrder && deliveredOrder.rider_id) {
          // Check if already rated
          const existingRating = await base44.entities.RiderRating.filter({ 
            order_id: deliveredOrder.id,
            customer_email: user.email 
          });
          
          if (existingRating.length === 0) {
            setRiderRatingOrder(deliveredOrder);
          }
        }
      } catch (error) {
        console.error('Error checking delivered orders:', error);
      }
    };

    checkDeliveredOrders();
    const interval = setInterval(checkDeliveredOrders, 10000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Poll for new notifications and show as browser notifications
  useEffect(() => {
    if (!user?.email) return;

    const checkNewNotifications = async () => {
      try {
        const notifications = await base44.entities.Notification.filter(
          { user_email: user.email, is_read: false },
          '-created_date',
          5
        );

        // Check for notifications created in last 60 seconds
        const recentNotifications = notifications.filter(n => {
          const notifTime = new Date(n.created_date).getTime();
          const now = Date.now();
          return (now - notifTime) < 60000; // 60 seconds
        });

        recentNotifications.forEach(async notification => {
          // Show browser notification with appealing image
          if ('Notification' in window && Notification.permission === 'granted') {
            let notificationImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
            
            if (notification.metadata?.image_url) {
              notificationImage = notification.metadata.image_url;
            }
            
            new Notification(notification.title, {
              body: notification.message,
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png',
              badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png',
              image: notificationImage,
              tag: notification.id,
              requireInteraction: false,
            });
          }

          toast.success(notification.message, {
            duration: 8000,
            position: 'top-center',
          });
          
          setTimeout(() => {
            base44.entities.Notification.update(notification.id, { is_read: true });
          }, 2000);
        });
      } catch (err) {
        console.error('Failed to check notifications:', err);
      }
    };

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Redirect to onboarding if not completed
      const onboardingDone = localStorage.getItem('onboarding_completed');
      if (!onboardingDone) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      // Show sign-in screen instead of redirecting (safe for WebView)
      setIsLoggedOut(true);
    }
  };

  const queryClient = useQueryClient();

  const { data: restaurants = [], isLoading: restaurantsLoading, error, refetch: refetchRestaurants } = useQuery({
    queryKey: ['approved-restaurants'],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ is_approved: true });
      return results;
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
      
      const itemsWithRestaurants = items.map((item) => {
        const restaurant = restaurants.find(r => r.id === item.restaurant_id);
        return { ...item, restaurant };
      });
      
      return itemsWithRestaurants.filter(item => {
        if (!item.restaurant?.is_approved || !item.restaurant?.is_open) return false;
        if (!item.promo_end_date) return true;
        return now <= new Date(item.promo_end_date);
      });
    },
    enabled: restaurants.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch unread chat messages
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

  // Count unread messages from admin/AI
  const unreadChatCount = chatMessages.filter(
    msg => (msg.sender_type === 'admin' || msg.sender_type === 'ai') && !msg.is_read
  ).length;

  useEffect(() => {
    if (user && promoItems.length > 0) {
      const promoShown = sessionStorage.getItem('promo_shown');
      if (!promoShown) {
        setTimeout(() => {
          setShowPromo(true);
          sessionStorage.setItem('promo_shown', 'true');
        }, 1000);
      }
    }
  }, [user, promoItems]);

  if (error) {
    console.error('Error loading restaurants:', error);
  }

  const cities = ['Sokoto'];

  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = selectedCity === 'all' || r.city === selectedCity;
      return matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (b.total_reviews || 0) - (a.total_reviews || 0);
    });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isRestaurantOpen = (restaurant) => {
    if (!restaurant.is_open) return false;
    if (!restaurant.opening_time || !restaurant.closing_time) return restaurant.is_open;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMin] = restaurant.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = restaurant.closing_time.split(':').map(Number);
    
    const openingTime = openHour * 60 + openMin;
    const closingTime = closeHour * 60 + closeMin;
    
    if (closingTime < openingTime) {
      return currentTime >= openingTime || currentTime <= closingTime;
    }
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }
    
    const newCart = cart.map(i => 
      i.item_id === itemId 
        ? { ...i, quantity: newQuantity }
        : i
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(i => i.item_id !== itemId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success('Item removed from cart');
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - cartPosition.x,
      y: e.clientY - cartPosition.y
    });
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - cartPosition.x,
      y: touch.clientY - cartPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragOffset.x - cartPosition.x;
        const deltaY = e.clientY - dragOffset.y - cartPosition.y;
        setCartPosition({
          x: cartPosition.x + deltaX * 1.5,
          y: cartPosition.y + deltaY * 1.5
        });
      }
    };

    const handleTouchMove = (e) => {
      if (isDragging) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragOffset.x - cartPosition.x;
        const deltaY = touch.clientY - dragOffset.y - cartPosition.y;
        setCartPosition({
          x: cartPosition.x + deltaX * 1.5,
          y: cartPosition.y + deltaY * 1.5
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  if (isLoggedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png"
            alt="Fooda Naija"
            className="h-16 w-auto object-contain mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Fooda Naija</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to order your favourite meals.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white transition-colors">
        <NoInternet />
      
      {/* Top Header - Welcome Message */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          {t('hi')}{user ? `, ${(user.full_name || '').split(' ')[0]}` : ''}! <span className="inline-block animate-wave">👋</span>
        </h2>
        <p className="text-sm text-gray-500">{t('whatToEat')}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-28">

        {/* Search Bar */}
        <div className="pt-2 pb-4">
          <div className="flex items-center gap-3">
              <div className="relative flex-1">
              <Input
                placeholder={t('searchRestaurants')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 transition-colors text-base"
              />
            </div>
          </div>
        </div>

        {/* Banner Carousel */}
        <BannerCarousel />

        {/* City Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCity === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('allCities')}
          </button>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCity === city
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Restaurants Grid */}
        {restaurantsLoading ? (
          <LoadingScreen />
        ) : filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500">{t('noRestaurantsFound')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => {
              const isOpen = isRestaurantOpen(restaurant);
              return isOpen ? (
                <Link key={restaurant.id} to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)} className="block">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer active:scale-95">
                  <div className="relative">
                    {restaurant.cover_image_url ? (
                      <img 
                        src={restaurant.cover_image_url} 
                        alt="" 
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-orange-100 to-yellow-100">
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-green-500/90 text-white">
                      ● {t('open')}
                    </div>
                  </div>
                  
                  <div className="p-4 pt-8">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-3">
                      {restaurant.description}
                    </p>

                    {restaurant.cuisine_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {restaurant.cuisine_types.slice(0, 2).map((cuisine, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-1 text-gray-600">
                       <Bike className="w-4 h-4" />
                       <span>5-15 {t('mins')}</span>
                     </div>
                     <div className="flex items-center gap-1 text-gray-600">
                       <span>₦500</span>
                     </div>
                     {restaurant.rating > 0 && (
                       <div className="flex items-center gap-1 text-amber-600">
                         <Star className="w-4 h-4 fill-amber-600" />
                         <span className="font-semibold">{restaurant.rating}</span>
                       </div>
                     )}
                    </div>
                  </div>
                  </div>
                </Link>
              ) : (
                <div key={restaurant.id} className="block cursor-not-allowed">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 opacity-60">
                  <div className="relative">
                    {restaurant.cover_image_url ? (
                      <img 
                        src={restaurant.cover_image_url} 
                        alt="" 
                        className="w-full h-44 object-cover grayscale"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-orange-100 to-yellow-100 grayscale">
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gray-800/90 text-white">
                      ● {t('closed')}
                    </div>
                  </div>
                  
                  <div className="p-4 pt-8">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-3">
                      {restaurant.description}
                    </p>

                    {restaurant.cuisine_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {restaurant.cuisine_types.slice(0, 2).map((cuisine, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-1 text-gray-600">
                       <Bike className="w-4 h-4" />
                       <span>5-15 {t('mins')}</span>
                     </div>
                     <div className="flex items-center gap-1 text-gray-600">
                       <span>₦500</span>
                     </div>
                     {restaurant.rating > 0 && (
                       <div className="flex items-center gap-1 text-amber-600">
                         <Star className="w-4 h-4 fill-amber-600" />
                         <span className="font-semibold">{restaurant.rating}</span>
                       </div>
                     )}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

        {/* Ramadan Banner */}
        <RamadanBanner />

        {/* Promo Modal */}
        {showPromo && promoItems.length > 0 && (
          <PromoModal 
            promoItems={promoItems} 
            onClose={() => setShowPromo(false)} 
          />
        )}

        {/* Voice Order Modal */}
        <VoiceOrderModal
          isOpen={showVoiceOrder}
          onClose={() => setShowVoiceOrder(false)}
          restaurants={restaurants}
          onAddToCart={(items) => {
            console.log('Add to cart:', items);
          }}
        />

        {/* Rider Rating Modal */}
        {riderRatingOrder && (
          <RiderRatingModal
            order={riderRatingOrder}
            onClose={() => setRiderRatingOrder(null)}
          />
        )}

        {/* Floating Cart Button */}
        {cartItemCount > 0 && (
          <button
            onClick={(e) => {
              if (!isDragging) setCartOpen(true);
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              left: `${cartPosition.x}px`,
              top: `${cartPosition.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            className={`fixed bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-2xl z-40 cursor-move ${
              !isDragging && 'hover:scale-110 transition-transform'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          </button>
        )}

        <FloatingCart 
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
        />

        {/* Bottom Navigation */}
        <BottomNav currentPage="CustomerHome" unreadChatCount={unreadChatCount} />
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