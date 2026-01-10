import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChefHat, Clock, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FloatingMenu from '../components/customer/FloatingMenu';

export default function Promos() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: restaurants = [] } = useQuery({
    queryKey: ['approved-restaurants'],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ is_approved: true });
      return results;
    },
  });

  const { data: promoItems = [], isLoading } = useQuery({
    queryKey: ['all-promo-items'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ is_promo: true, is_available: true });
      const now = new Date();
      
      const activeItems = items.filter(item => {
        if (!item.promo_start_date || !item.promo_end_date) return true;
        const start = new Date(item.promo_start_date);
        const end = new Date(item.promo_end_date);
        return now >= start && now <= end;
      });

      const itemsWithRestaurants = await Promise.all(
        activeItems.map(async (item) => {
          const restaurant = restaurants.find(r => r.id === item.restaurant_id);
          return { ...item, restaurant };
        })
      );
      return itemsWithRestaurants.filter(item => item.restaurant?.is_approved && item.restaurant?.is_open);
    },
    enabled: restaurants.length > 0,
  });

  // Group promos by restaurant
  const promosByRestaurant = promoItems.reduce((acc, item) => {
    const restaurantId = item.restaurant_id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurant: item.restaurant,
        items: []
      };
    }
    acc[restaurantId].items.push(item);
    return acc;
  }, {});

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('CustomerHome')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Best Orders
                </h1>
                <p className="text-xs text-gray-500">Special deals & promos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
              alt="Loading..." 
              className="h-16 w-auto object-contain animate-pulse"
            />
          </div>
        ) : Object.keys(promosByRestaurant).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Promos</h3>
            <p className="text-gray-500 text-center mb-6">Check back later for special deals!</p>
            <Link to={createPageUrl('CustomerHome')}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Browse Restaurants
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(promosByRestaurant).map(([restaurantId, { restaurant, items }]) => (
              <div key={restaurantId} className="space-y-4">
                {/* Restaurant Header */}
                <Link to={createPageUrl(`RestaurantDetail?id=${restaurantId}`)}>
                  <Card className="bg-white border-orange-100 hover:shadow-xl transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {restaurant.logo_url ? (
                          <img 
                            src={restaurant.logo_url} 
                            alt="" 
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-orange-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h2>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {restaurant.delivery_time}
                            </div>
                            {restaurant.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                {restaurant.rating}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-orange-500 text-white">
                          {items.length} Promo{items.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Promo Items Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <Link key={item.id} to={createPageUrl(`RestaurantDetail?id=${restaurantId}`)}>
                      <Card className="bg-white border-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Promo
                          </Badge>
                        </div>
                        <CardContent className="p-0">
                          {item.images?.[0] && (
                            <img 
                              src={item.images[0]} 
                              alt="" 
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-orange-600">
                                ₦{item.price?.toLocaleString()}
                              </p>
                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                View
                              </Button>
                            </div>
                            {item.promo_end_date && (
                              <p className="text-xs text-gray-500 mt-2">
                                Ends: {new Date(item.promo_end_date).toLocaleDateString('en-NG', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingMenu cartCount={cartItemCount} userEmail={user?.email} />
    </div>
  );
}