import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Star, Clock, MapPin, Phone, Bike, 
  Plus, Minus, ShoppingBag, Heart, Share2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MenuItemCard from '../components/ui/MenuItemCard';

export default function Restaurant() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCart(savedCart);
  }, []);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => base44.entities.Restaurant.filter({ id: restaurantId }).then(r => r[0]),
    enabled: !!restaurantId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => base44.entities.MenuCategory.filter({ restaurant_id: restaurantId, is_active: true }),
    enabled: !!restaurantId,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurantId }),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const addToCart = (item) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(c => c.item_id === item.id);
    
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({
        item_id: item.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurant?.name,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1
      });
    }
    
    setCart(newCart);
    localStorage.setItem('foodanaija_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(c => c.item_id === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (restaurantLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-64 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant not found</h2>
        <Link to={createPageUrl('Home')}>
          <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80">
        <img 
          src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <Link to={createPageUrl('Home')} className="absolute top-4 left-4">
          <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
            <Heart className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-start gap-4">
            {restaurant.logo_url && (
              <img 
                src={restaurant.logo_url} 
                alt="" 
                className="w-16 h-16 rounded-xl bg-white shadow-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                {restaurant.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-white/70">({restaurant.total_reviews || 0})</span>
                  </div>
                )}
                <Badge className={restaurant.is_open ? 'bg-emerald-500' : 'bg-gray-500'}>
                  {restaurant.is_open ? 'Open' : 'Closed'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>{restaurant.delivery_time || '30-45 mins'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-emerald-500" />
            <span>₦{restaurant.delivery_fee?.toLocaleString() || 500} delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-500" />
            <span>Min order: ₦{restaurant.min_order?.toLocaleString() || 1000}</span>
          </div>
        </div>
        {restaurant.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
            <MapPin className="w-4 h-4" />
            <span>{restaurant.address}</span>
          </div>
        )}
      </div>

      {/* Menu Categories Tabs */}
      <div className="sticky top-16 bg-white/95 backdrop-blur-sm z-30 border-b border-gray-100">
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
        {categories.filter(cat => !selectedCategory || cat.id === selectedCategory).map((category) => {
          const categoryItems = menuItems.filter(item => item.category_id === category.id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
              <div className="grid gap-3">
                {categoryItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                    isInCart={getItemQuantity(item.id) > 0}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500">No menu items available yet</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40">
          <Link to={createPageUrl('Cart')}>
            <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/30">
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
                </div>
                <span className="font-bold">₦{cartTotal.toLocaleString()}</span>
              </div>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}