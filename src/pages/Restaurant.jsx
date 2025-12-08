import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Star, Phone, Mail, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MenuItemCard from '../components/ui/MenuItemCard';
import { toast } from 'sonner';

export default function Restaurant() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCart(savedCart);
  }, []);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ id: restaurantId });
      return restaurants[0];
    },
    enabled: !!restaurantId
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      const cats = await base44.entities.MenuCategory.filter({ 
        restaurant_id: restaurantId,
        is_active: true 
      }, 'display_order');
      return cats;
    },
    enabled: !!restaurantId
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: async () => {
      const items = await base44.entities.MenuItem.filter({ 
        restaurant_id: restaurantId 
      });
      return items;
    },
    enabled: !!restaurantId
  });

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
      toast.success('Quantity updated in cart');
    } else {
      newCart = [...cart, { 
        ...item, 
        quantity: 1,
        restaurant_id: restaurantId,
        restaurant_name: restaurant?.name
      }];
      toast.success('Added to cart');
    }
    
    setCart(newCart);
    localStorage.setItem('foodanaija_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const isInCart = (itemId) => cart.some(c => c.id === itemId);

  if (restaurantLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <Skeleton className="h-64 w-full rounded-3xl mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h2>
          <Button onClick={() => navigate(-1)} className="bg-emerald-600 hover:bg-emerald-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="ml-4 mt-4 mb-2"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </Button>

      {/* Restaurant Header */}
      <div className="relative h-64 mb-6 overflow-hidden rounded-3xl mx-4">
        <img 
          src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Restaurant Logo */}
        {restaurant.logo_url && (
          <div className="absolute bottom-4 left-4 w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Status Badge */}
        <Badge 
          className={`absolute top-4 right-4 ${
            restaurant.is_open 
              ? 'bg-emerald-500/90 backdrop-blur-sm' 
              : 'bg-gray-500/90 backdrop-blur-sm'
          }`}
        >
          {restaurant.is_open ? 'Open Now' : 'Closed'}
        </Badge>
      </div>

      <div className="px-4">
        {/* Restaurant Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
          <p className="text-gray-600 mb-4">{restaurant.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {restaurant.rating && (
              <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-amber-700">{restaurant.rating?.toFixed(1)}</span>
                <span className="text-gray-500">({restaurant.total_reviews} reviews)</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700">{restaurant.delivery_time || '30-45 mins'}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{restaurant.address}, {restaurant.city}</span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Open {restaurant.opening_time} - {restaurant.closing_time}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-emerald-50 rounded-xl px-4 py-2">
              <span className="text-gray-600">Delivery Fee: </span>
              <span className="font-semibold text-emerald-700">₦{restaurant.delivery_fee?.toLocaleString()}</span>
            </div>
            <div className="bg-amber-50 rounded-xl px-4 py-2">
              <span className="text-gray-600">Min Order: </span>
              <span className="font-semibold text-amber-700">₦{restaurant.min_order?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
          
          {categoriesLoading || itemsLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <Skeleton key={j} className="h-28 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <p className="text-gray-500">No menu items available yet</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map(category => {
                const categoryItems = menuItems.filter(item => item.category_id === category.id);
                
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                    )}
                    <div className="space-y-3">
                      {categoryItems.map(item => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAddToCart={addToCart}
                          isInCart={isInCart(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}