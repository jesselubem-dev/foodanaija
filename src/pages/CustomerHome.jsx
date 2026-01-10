import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, MapPin, Star, Clock, Bike, ChefHat, ShoppingBag, History, LogOut, ChevronRight, MessageSquare, Headset
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FloatingMenu from '../components/customer/FloatingMenu';
import NotificationBell from '../components/customer/NotificationBell';
import PromoModal from '../components/customer/PromoModal';
import BannerCarousel from '../components/customer/BannerCarousel';
import VoiceOrderModal from '../components/customer/VoiceOrderModal';

export default function CustomerHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [showVoiceOrder, setShowVoiceOrder] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

        // Check for notifications created in last 30 seconds
        const recentNotifications = notifications.filter(n => {
          const notifTime = new Date(n.created_date).getTime();
          const now = Date.now();
          return (now - notifTime) < 30000; // 30 seconds
        });

        recentNotifications.forEach(async notification => {
          // Show browser notification with appealing image
          if ('Notification' in window && Notification.permission === 'granted') {
            // Try to extract restaurant info from notification metadata or fetch a random promo image
            let notificationImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'; // Default food image
            
            // If notification has metadata with restaurant/item info, use that image
            if (notification.metadata?.image_url) {
              notificationImage = notification.metadata.image_url;
            }
            
            new Notification(notification.title, {
              body: notification.message,
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg',
              badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg',
              image: notificationImage,
              tag: notification.id,
              requireInteraction: false,
            });
          }

          // Also show toast for in-app
          toast.success(notification.message, {
            duration: 8000,
            position: 'top-center',
          });
          
          // Mark as read after showing
          setTimeout(() => {
            base44.entities.Notification.update(notification.id, { is_read: true });
          }, 2000);
        });
      } catch (err) {
        console.error('Failed to check notifications:', err);
      }
    };

    // Check immediately and then every 15 seconds
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      if (!onboardingCompleted) {
        window.location.href = createPageUrl('Onboarding');
        return;
      }

      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: restaurants = [], isLoading, error } = useQuery({
    queryKey: ['approved-restaurants'],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ is_approved: true });
      return results;
    },
  });

  const { data: promoItems = [] } = useQuery({
    queryKey: ['promo-items'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ is_promo: true, is_available: true });
      const itemsWithRestaurants = await Promise.all(
        items.map(async (item) => {
          const restaurant = restaurants.find(r => r.id === item.restaurant_id);
          return { ...item, restaurant };
        })
      );
      return itemsWithRestaurants.filter(item => item.restaurant?.is_approved && item.restaurant?.is_open);
    },
    enabled: restaurants.length > 0,
  });

  // Fetch unread chat messages
  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const chatId = localStorage.getItem(`chat_id_${user.email}`);
      if (!chatId) return [];
      return await base44.entities.ChatMessage.filter({ chat_id: chatId }, '-created_date');
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
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

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || r.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Modern App Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
                alt="Fooda Naija" 
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link to={createPageUrl('LiveChat')}>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadChatCount}
                    </span>
                  )}
                </Button>
              </Link>
              <NotificationBell userEmail={user?.email} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {/* Compact Welcome */}
        {user && (
          <div className="pt-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hi, {user.full_name.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">What would you like to eat today?</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="pt-2 pb-4">
          <div className="flex items-center gap-3">
              <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search restaurants or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-colors text-base"
              />
            </div>
          </div>
        </div>

        {/* Live Support Card */}
        <Link to={createPageUrl('LiveChat')}>
          <Card className="mb-6 bg-gradient-to-r from-orange-500 to-amber-600 border-none hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Headset className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Need Help?</h3>
                    <p className="text-white/90 text-sm">Chat with Fooda AI Support</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadChatCount > 0 && (
                    <span className="w-8 h-8 bg-red-500 text-white text-sm rounded-full flex items-center justify-center font-bold">
                      {unreadChatCount}
                    </span>
                  )}
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Banner Carousel */}
        <BannerCarousel />

        {/* City Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCity === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Cities
          </button>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCity === city
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Restaurants Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
              alt="Loading..." 
              className="h-16 w-auto object-contain animate-pulse"
            />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No restaurants found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    {restaurant.cover_image_url ? (
                      <img 
                        src={restaurant.cover_image_url} 
                        alt="" 
                        className={`w-full h-44 object-cover ${!restaurant.is_open ? 'grayscale opacity-60' : ''}`}
                      />
                    ) : (
                      <div className={`w-full h-44 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center ${!restaurant.is_open ? 'grayscale opacity-60' : ''}`}>
                        <ChefHat className="w-14 h-14 text-orange-600" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      restaurant.is_open 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-gray-800/90 text-white'
                    }`}>
                      {restaurant.is_open ? '● Open' : '● Closed'}
                    </div>

                    {/* Logo Overlay */}
                    {restaurant.logo_url && (
                      <div className="absolute -bottom-6 left-4">
                        <img 
                          src={restaurant.logo_url} 
                          alt="" 
                          className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 pt-8">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{restaurant.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">{restaurant.description}</p>

                    {/* Cuisine Tags */}
                    {restaurant.cuisine_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {restaurant.cuisine_types.slice(0, 2).map((cuisine, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Info Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.delivery_time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Bike className="w-4 h-4" />
                        <span>₦{restaurant.delivery_fee?.toLocaleString()}</span>
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="w-4 h-4 fill-amber-500" />
                          <span className="font-semibold">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Menu */}
      <FloatingMenu cartCount={cartItemCount} userEmail={user?.email} />

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
          // Handle adding items to cart
          console.log('Add to cart:', items);
        }}
      />
    </div>
  );
}