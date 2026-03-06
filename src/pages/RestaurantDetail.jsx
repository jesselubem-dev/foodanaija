import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Plus, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import ReviewSection from '../components/restaurant/ReviewSection';
import FloatingCart from '../components/customer/FloatingCart';
import { LanguageProvider } from '../components/LanguageContext';

function RestaurantDetailContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
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

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ id: restaurantId });
      return restaurants[0];
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ 
      restaurant_id: restaurantId, 
      is_available: true 
    }),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: () => base44.entities.MenuCategory.filter({ 
      restaurant_id: restaurantId,
      is_active: true 
    }),
    enabled: !!restaurantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ 
      restaurant_id: restaurantId 
    }),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  const addToCart = (item) => {
    if (!restaurant.is_open) {
      toast.error('This restaurant is currently closed');
      return;
    }

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
    setCartOpen(true);
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

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loadingRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <Link to={createPageUrl('Cart')}>
              <Button className="relative bg-gradient-to-r from-orange-500 to-orange-600">
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
            className={`w-full h-64 object-cover ${!restaurant.is_open ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className={`w-full h-64 bg-gradient-to-br from-orange-100 to-yellow-100 ${!restaurant.is_open ? 'grayscale opacity-60' : ''}`}>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4">
          <Card className="relative -mt-16 border-orange-100">
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
                    <div>
                      {restaurant.city}
                    </div>
                    <div>
                      {restaurant.delivery_time}
                    </div>
                    <div>
                      ₦{restaurant.delivery_fee?.toLocaleString()} delivery
                    </div>
                    {restaurant.rating > 0 && (
                      <div>
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

                  {!restaurant.is_open && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium">This restaurant is currently closed and not accepting orders</p>
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
              className={selectedCategory === 'all' ? 'bg-orange-600' : ''}
            >
              All Items
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'bg-orange-600' : ''}
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
              <p className="text-gray-500">No menu items available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <Card key={item.id} className="border-orange-100 hover:shadow-lg transition-shadow">
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
                      <p className="text-base font-bold text-orange-600">
                        ₦{item.price?.toLocaleString()}
                      </p>
                      
                      {quantity === 0 ? (
                        <Button
                          onClick={() => addToCart(item)}
                          disabled={!restaurant.is_open}
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          {restaurant.is_open ? 'Add' : 'Closed'}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-bold text-sm w-6 text-center">{quantity}</span>
                          <Button
                            size="icon"
                            className="bg-orange-600 h-7 w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={!restaurant.is_open}
                          >
                            <Plus className="w-3 h-3" />
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

      <FloatingCart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
}

export default function RestaurantDetail() {
  return (
    <LanguageProvider>
      <RestaurantDetailContent />
    </LanguageProvider>
  );
}