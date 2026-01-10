import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Clock, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FloatingMenu from '../components/customer/FloatingMenu';

export default function Promos() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

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
      const results = await base44.entities.Restaurant.filter({ is_approved: true, is_open: true });
      return results;
    },
  });

  const { data: allPromoItems = [] } = useQuery({
    queryKey: ['all-promo-items'],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ is_promo: true, is_available: true });
      return items;
    },
  });

  // Filter active promos and group by restaurant
  const activePromos = allPromoItems.filter(item => {
    if (!item.promo_start_date || !item.promo_end_date) return true;
    const now = new Date();
    const start = new Date(item.promo_start_date);
    const end = new Date(item.promo_end_date);
    return now >= start && now <= end;
  });

  const restaurantsWithPromos = restaurants.map(restaurant => {
    const promos = activePromos.filter(item => item.restaurant_id === restaurant.id);
    return { ...restaurant, promos };
  }).filter(r => r.promos.length > 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">Special Promos</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {restaurantsWithPromos.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="text-center py-16">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Promos</h3>
              <p className="text-gray-500 mb-4">Check back soon for exciting deals!</p>
              <Link to={createPageUrl('CustomerHome')}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Browse Restaurants
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {restaurantsWithPromos.map((restaurant) => (
              <div key={restaurant.id} className="space-y-4">
                {/* Restaurant Header */}
                <Link to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}>
                  <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {restaurant.logo_url && (
                          <img 
                            src={restaurant.logo_url} 
                            alt="" 
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900">{restaurant.name}</h2>
                            <Badge className="bg-orange-500 text-white">
                              {restaurant.promos.length} Promo{restaurant.promos.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {restaurant.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {restaurant.delivery_time}
                            </span>
                            {restaurant.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                {restaurant.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Promo Items Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurant.promos.map((item) => (
                    <Link 
                      key={item.id} 
                      to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}
                    >
                      <Card className="border-orange-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-orange-500 text-white animate-pulse">
                            🔥 PROMO
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          {item.images?.[0] && (
                            <img 
                              src={item.images[0]} 
                              alt="" 
                              className="w-full h-40 object-cover rounded-xl mb-3"
                            />
                          )}
                          
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-orange-600">
                              ₦{item.price?.toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-500 to-orange-600"
                            >
                              View Deal
                            </Button>
                          </div>

                          {item.promo_end_date && (
                            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Ends {new Date(item.promo_end_date).toLocaleDateString()}
                            </p>
                          )}
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