import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Clock, Bike, Star, Plus, Minus, ShoppingBag, ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import ReviewSection from '../components/restaurant/ReviewSection';

export default function RestaurantDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ id: restaurantId });
      return restaurants[0];
    },
    enabled: !!restaurantId,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ 
      restaurant_id: restaurantId, 
      is_available: true 
    }),
    enabled: !!restaurantId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: () => base44.entities.MenuCategory.filter({ 
      restaurant_id: restaurantId,
      is_active: true 
    }),
    enabled: !!restaurantId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ 
      restaurant_id: restaurantId 
    }),
    enabled: !!restaurantId,
  });

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.item_id === item.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(i => 
        i.item_id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newCart = [...cart, {
        item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.images?.[0],
        restaurant_id: restaurantId,
        restaurant_name: restaurant.name
      }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success(`${item.name} added to cart`);
  };

  const getItemQuantity = (itemId) => {
    const cartItem = cart.find(i => i.item_id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const updateQuantity = (itemId, delta) => {
    const newCart = cart.map(i => {
      if (i.item_id === itemId) {
        const newQuantity = i.quantity + delta;
        return newQuantity > 0 ? { ...i, quantity: newQuantity } : null;
      }
      return i;
    }).filter(Boolean);
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loadingRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <Link to={createPageUrl('Cart')}>
              <Button className="relative bg-gradient-to-r from-emerald-500 to-emerald-600">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Restaurant Header */}
      <div className="relative">
        {restaurant.cover_image_url ? (
          <img 
            src={restaurant.cover_image_url} 
            alt="" 
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center">
            <ChefHat className="w-24 h-24 text-emerald-600" />
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4">
          <Card className="relative -mt-16 border-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {restaurant.logo_url && (
                  <img 
                    src={restaurant.logo_url} 
                    alt="" 
                    className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <p className="text-gray-600 mb-4">{restaurant.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {restaurant.city}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {restaurant.delivery_time}
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-emerald-600" />
                      ₦{restaurant.delivery_fee?.toLocaleString()} delivery
                    </div>
                    {restaurant.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {restaurant.rating} ({restaurant.total_reviews} reviews)
                      </div>
                    )}
                  </div>

                  {restaurant.cuisine_types?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {restaurant.cuisine_types.map((cuisine, idx) => (
                        <Badge key={idx} variant="outline">{cuisine}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-emerald-600' : ''}
            >
              All Items
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'bg-emerald-600' : ''}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No menu items available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <Card key={item.id} className="border-emerald-100 hover:shadow-lg transition-shadow">
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
                      <p className="text-xl font-bold text-emerald-600">
                        ₦{item.price?.toLocaleString()}
                      </p>
                      
                      {quantity === 0 ? (
                        <Button
                          onClick={() => addToCart(item)}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-8 text-center">{quantity}</span>
                          <Button
                            size="icon"
                            className="bg-emerald-600"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection restaurant={restaurant} reviews={reviews} />
        </div>
      </div>
    </div>
  );
}