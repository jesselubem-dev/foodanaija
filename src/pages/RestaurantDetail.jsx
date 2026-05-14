import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Plus, Minus, Star, Clock, Bike, MapPin, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReviewSection from '../components/restaurant/ReviewSection';
import FloatingCart from '../components/customer/FloatingCart';
import { LanguageProvider } from '../components/LanguageContext';

function RestaurantDetailContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const deepLinkItemId = urlParams.get('item');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  };

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => { const res = await base44.entities.Restaurant.filter({ id: restaurantId }); return res[0]; },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurantId, is_available: true }),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: () => base44.entities.MenuCategory.filter({ restaurant_id: restaurantId, is_active: true }),
    enabled: !!restaurantId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn: () => base44.entities.Review.filter({ restaurant_id: restaurantId }),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (deepLinkItemId && menuItems.length > 0) {
      const item = menuItems.find(i => i.id === deepLinkItemId);
      if (item) setSelectedItem(item);
    }
  }, [deepLinkItemId, menuItems]);

  const shuffledItems = useMemo(() => {
    const arr = [...menuItems];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [menuItems]);

  const filteredItems = selectedCategory === 'all' ? shuffledItems : shuffledItems.filter(item => item.category_id === selectedCategory);

  const addToCart = (item) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (!restaurant.is_open) { toast.error('This restaurant is currently closed'); return; }
    const existingItem = cart.find(i => i.item_id === item.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newCart = [...cart, { item_id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.images?.[0], restaurant_id: restaurantId, restaurant_name: restaurant.name }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success(`${item.name} added`);
  };

  const getItemQuantity = (itemId) => cart.find(i => i.item_id === itemId)?.quantity || 0;

  const updateQuantity = (itemId, delta) => {
    const newCart = cart.map(i => {
      if (i.item_id === itemId) {
        const q = i.quantity + delta;
        return q > 0 ? { ...i, quantity: q } : null;
      }
      return i;
    }).filter(Boolean);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
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

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-[#F8F7F5] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5] pb-32">
      {/* Hero Image */}
      <div className="relative">
        {restaurant.cover_image_url ? (
          <img src={restaurant.cover_image_url} alt="" className={`w-full h-56 object-cover ${!restaurant.is_open ? 'grayscale' : ''}`} />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-orange-200 to-amber-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <Link to={createPageUrl('CustomerHome')} className="absolute top-12 left-4 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </Link>

        {/* Cart button */}
        {cartItemCount > 0 && (
          <button onClick={() => setCartOpen(true)} className="absolute top-12 right-4 bg-orange-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">{cartItemCount}</span>
          </button>
        )}
      </div>

      {/* Restaurant Info Card */}
      <div className="bg-white rounded-t-3xl -mt-6 relative px-4 pt-5 pb-4">
        <div className="flex items-start gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
              <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {restaurant.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
            {restaurant.cuisine_types?.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">{restaurant.cuisine_types.join(' · ')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          {restaurant.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-gray-800">{restaurant.rating}</span>
              <span className="text-gray-400">({restaurant.total_reviews})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>5–15 min</span>
          </div>
          <div className="flex items-center gap-1">
            <Bike className="w-4 h-4" />
            <span>₦{restaurant.delivery_fee?.toLocaleString() || '500'}</span>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-sm text-gray-500 mt-3 line-clamp-2">{restaurant.description}</p>
        )}

        {!restaurant.is_open && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600 text-sm font-medium text-center">This restaurant is currently closed</p>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="bg-white border-t border-gray-100 sticky top-0 z-20">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 pt-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No items available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 active:scale-95 transition-transform cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt="" className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}

                  {item.is_popular && (
                    <div className="px-3 pt-2">
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">🔥 Popular</span>
                    </div>
                  )}

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mb-2">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-orange-600">₦{item.price?.toLocaleString()}</p>
                        {item.slashed_price && (
                          <p className="text-xs text-gray-400 line-through">₦{item.slashed_price?.toLocaleString()}</p>
                        )}
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!restaurant.is_open}
                          className="w-8 h-8 bg-orange-500 disabled:bg-gray-200 rounded-full flex items-center justify-center shadow-sm shadow-orange-200 disabled:shadow-none"
                        >
                          <Plus className="w-4 h-4 text-white disabled:text-gray-400" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-1.5 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Minus className="w-3 h-3 text-orange-500" />
                          </button>
                          <span className="text-xs font-bold text-gray-900 w-4 text-center">{qty}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} disabled={!restaurant.is_open} className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <ReviewSection restaurant={restaurant} reviews={reviews} />
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="p-0 max-w-md overflow-hidden rounded-3xl border-0">
          {selectedItem && (
            <>
              {selectedItem.images?.[0] ? (
                <img src={selectedItem.images[0]} alt={selectedItem.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}
              <div className="p-5">
                {selectedItem.is_popular && (
                  <span className="text-[11px] font-bold bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full mb-3 inline-block">🔥 Popular Item</span>
                )}
                <h2 className="text-xl font-bold text-gray-900 mt-1 mb-1">{selectedItem.name}</h2>
                {selectedItem.description && (
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{selectedItem.description}</p>
                )}
                {selectedItem.preparation_time && (
                  <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Ready in {selectedItem.preparation_time}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xl font-bold text-orange-600">₦{selectedItem.price?.toLocaleString()}</p>
                    {selectedItem.slashed_price && (
                      <p className="text-sm text-gray-400 line-through">₦{selectedItem.slashed_price?.toLocaleString()}</p>
                    )}
                  </div>
                  {getItemQuantity(selectedItem.id) === 0 ? (
                    <Button
                      onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                      disabled={!restaurant.is_open}
                      className="bg-orange-500 hover:bg-orange-600 rounded-full px-6"
                    >
                      {restaurant.is_open ? 'Add to Cart' : 'Closed'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 bg-orange-50 rounded-full px-2 py-1.5">
                      <button onClick={() => updateQuantity(selectedItem.id, -1)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Minus className="w-4 h-4 text-orange-500" />
                      </button>
                      <span className="font-bold text-gray-900 w-5 text-center">{getItemQuantity(selectedItem.id)}</span>
                      <button onClick={() => updateQuantity(selectedItem.id, 1)} disabled={!restaurant.is_open} className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FloatingCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />

      {/* Sticky Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 text-white rounded-2xl py-4 flex items-center justify-between px-5 shadow-xl shadow-orange-200"
          >
            <span className="bg-white/20 rounded-lg px-2.5 py-1 text-sm font-bold">{cartItemCount}</span>
            <span className="font-semibold text-base">View Cart</span>
            <span className="font-bold text-base">₦{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
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