import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { isRestaurantOpen, formatTime } from '../utils/restaurantHours';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Heart, Plus, Minus, Check, Clock, X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReviewSection from '../components/restaurant/ReviewSection';
import FloatingCart from '../components/customer/FloatingCart';
import { LanguageProvider } from '../components/LanguageContext';
import { ChipGroup } from '../components/fooda/ui';
import { syncAbandonedCart } from '@/lib/trackAbandonedCart';

const FAV_KEY = 'favourite_restaurants';
const readFavs = () => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
};

function RestaurantDetailContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const deepLinkItemId = urlParams.get('item');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [isFavourite, setIsFavourite] = useState(() => readFavs().includes(restaurantId));
  const searchInputRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch {
      // not logged in — browsing is still allowed
    }
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {}
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

  // Only categories that actually contain dishes, in the restaurant's display order.
  const sortedCategories = useMemo(() => {
    const used = new Set(menuItems.map(i => i.category_id));
    return categories
      .filter(c => used.has(c.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || (a.name || '').localeCompare(b.name || ''));
  }, [categories, menuItems]);

  // Group the (filtered) menu into sections by category, in display order.
  const sections = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    const visible = menuItems
      .filter(item => selectedCategory === 'all' || item.category_id === selectedCategory)
      .filter(item => !term ||
        (item.name || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term))
      .sort((a, b) => (Number(!!b.is_popular) - Number(!!a.is_popular)) || (a.name || '').localeCompare(b.name || ''));

    const known = new Set(sortedCategories.map(c => c.id));
    const result = sortedCategories
      .map(cat => ({ id: cat.id, title: cat.name, items: visible.filter(i => i.category_id === cat.id) }))
      .filter(s => s.items.length > 0);
    const others = visible.filter(i => !known.has(i.category_id));
    if (others.length > 0) result.push({ id: 'other', title: sortedCategories.length ? 'Other' : 'Menu', items: others });
    return result;
  }, [menuItems, sortedCategories, selectedCategory, menuSearch]);

  const isOpen = restaurant ? isRestaurantOpen(restaurant) : false;

  const addToCart = (item) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (!isOpen) { toast.error('This restaurant is currently closed'); return; }
    const existingItem = cart.find(i => i.item_id === item.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newCart = [...cart, { item_id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.images?.[0], restaurant_id: restaurantId, restaurant_name: restaurant.name }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    syncAbandonedCart(newCart);
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

  const toggleFavourite = () => {
    const favs = readFavs();
    const next = favs.includes(restaurantId) ? favs.filter(id => id !== restaurantId) : [...favs, restaurantId];
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch {}
    const nowFav = next.includes(restaurantId);
    setIsFavourite(nowFav);
    toast.success(nowFav ? 'Saved to favourites' : 'Removed from favourites');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-fooda-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Restaurant not found</p>
        <Link to={createPageUrl('CustomerHome')} className="text-sm font-semibold text-fooda-green">Back to home</Link>
      </div>
    );
  }

  const closingLabel = formatTime(restaurant.closing_time);
  const openingLabel = formatTime(restaurant.opening_time);
  const statusShort = isOpen
    ? (closingLabel ? `OPEN UNTIL ${closingLabel}` : 'OPEN NOW')
    : 'CLOSED';
  const statusLong = isOpen
    ? (closingLabel ? `Open until ${closingLabel.toLowerCase().replace(' ', '')}` : 'Open now')
    : (openingLabel ? `Closed · opens ${openingLabel.toLowerCase().replace(' ', '')}` : 'Closed');
  const subtitle = restaurant.cuisine_types?.length ? restaurant.cuisine_types.slice(0, 3).join(' · ') : '';

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">

        {/* Hero + info card */}
        <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          <div className="relative">
            {restaurant.cover_image_url ? (
              <img
                src={restaurant.cover_image_url}
                alt={restaurant.name}
                className={`w-full h-[170px] object-cover ${!isOpen ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-[170px] f-tint-gold" />
            )}

            <Link
              to={createPageUrl('CustomerHome')}
              aria-label="Back"
              className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm press f-float"
            >
              <ArrowLeft className="w-5 h-5 f-on-gold" />
            </Link>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => { setSearchOpen(o => !o); if (searchOpen) setMenuSearch(''); }}
                aria-label="Search menu"
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm press f-float"
              >
                {searchOpen
                  ? <X className="w-5 h-5 f-on-gold" />
                  : <Search className="w-5 h-5 f-on-gold" />}
              </button>
              <button
                onClick={toggleFavourite}
                aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm press f-float"
              >
                <Heart
                  className="w-5 h-5"
                  style={{ color: isFavourite ? '#E5383B' : '#111111', fill: isFavourite ? '#E5383B' : 'none' }}
                />
              </button>
            </div>

            <span
              className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full shadow-sm"
              style={{ backgroundColor: '#ffffff', color: isOpen ? '#0B4D33' : '#B91C1C' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isOpen ? '#15803D' : '#DC2626' }} />
              {statusShort}
            </span>
          </div>

          <div className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[22px] font-medium text-gray-900 leading-tight truncate">{restaurant.name}</h1>
                {subtitle && <p className="text-[12px] font-semibold text-gray-700 mt-0.5 truncate">{subtitle}</p>}
              </div>
              <span
                className={`flex-shrink-0 text-[12px] font-medium px-2.5 py-1 rounded-full ${isOpen ? 'f-tint-gold text-gray-900' : 'f-tint-red f-text-red-strong'}`}
              >
                {statusLong}
              </span>
            </div>

            {restaurant.description && (
              <p className="text-[12px] text-gray-500 mt-2 line-clamp-2">{restaurant.description}</p>
            )}

            <div className="flex items-center justify-between mt-3 text-[12px] font-medium text-gray-800">
              <span>{restaurant.delivery_time || '30-45 mins'}</span>
              <span>Delivery ₦{Number(restaurant.delivery_fee ?? 800).toLocaleString()}</span>
              <span>Min. ₦{Number(restaurant.min_order ?? 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Menu search (from the search button) */}
        {searchOpen && (
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder={`Search ${restaurant.name}'s menu`}
              className="w-full h-11 pl-10 pr-3 rounded-[14px] border border-gray-200 bg-white text-[14px] text-gray-900 outline-none focus:ring-1 focus:ring-fooda-gold"
            />
          </div>
        )}

        {/* Category chips */}
        {sortedCategories.length > 1 && (
          <ChipGroup
            wrap
            className="mt-4"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[{ id: 'all', label: 'All' }, ...sortedCategories.map(c => ({ id: c.id, label: c.name }))]}
          />
        )}

        {!isOpen && (
          <div className="mt-4 p-3 rounded-xl border f-tint-red f-border-red">
            <p className="text-sm font-medium text-center f-text-red-strong">
              This restaurant is currently closed{openingLabel ? ` · opens ${openingLabel}` : ''}
            </p>
          </div>
        )}

        {/* Menu sections */}
        <div className="mt-5 sm:px-3">
          {sections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">{menuSearch ? 'No dishes match your search' : 'No items available'}</p>
            </div>
          ) : (
            sections.map(section => (
              <section key={section.id} className="mb-6">
                <h2 className="text-[15px] font-medium text-gray-900 mb-2.5">{section.title}</h2>
                <div className="space-y-3">
                  {section.items.map(item => {
                    const qty = getItemQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`flex items-center gap-3 p-2 rounded-2xl border cursor-pointer press-card ${
                          qty > 0 ? 'border-fooda-gold/40 f-tint-cream' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} loading="lazy" className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-[60px] h-[60px] rounded-xl f-tint-gold flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-[15px] font-medium text-gray-900 leading-tight truncate">{item.name}</h3>
                            {item.is_popular && <span className="text-[11px] flex-shrink-0" title="Popular">🔥</span>}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{item.description}</p>
                          )}
                          <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-[14px] font-medium text-gray-900">₦{Number(item.price || 0).toLocaleString()}</span>
                            {item.slashed_price > 0 && (
                              <span className="text-[11px] text-gray-400 line-through">₦{Number(item.slashed_price).toLocaleString()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-end" onClick={e => e.stopPropagation()}>
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={!isOpen}
                              className="h-9 px-3.5 rounded-lg text-[12px] font-semibold disabled:opacity-50 press"
                              style={{ backgroundColor: isOpen ? '#F5B700' : '#E5E7EB', color: '#111111' }}
                            >
                              {isOpen ? 'ADD +' : 'CLOSED'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedItem(item)}
                              aria-label={`${qty} in cart — change quantity`}
                              className="h-9 px-3 rounded-lg text-[12px] font-semibold flex items-center gap-1 border f-tint-green f-text-green f-border-green"
                            >
                              ADDED{qty > 1 ? ` ×${qty}` : ''} <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Reviews */}
          <div className="mt-8">
            <ReviewSection restaurant={restaurant} reviews={reviews} />
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="p-0 max-w-md overflow-hidden rounded-3xl border-0 gap-0">
          {selectedItem && (
            <>
              {/* Hero image with overlaid badge */}
              <div className="relative">
                {selectedItem.images?.[0] ? (
                  <img src={selectedItem.images[0]} alt={selectedItem.name} className="w-full h-72 object-cover" />
                ) : (
                  <div className="w-full h-72 f-tint-gold flex items-center justify-center">
                    <span className="text-7xl">🍽️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                {selectedItem.is_popular && (
                  <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 f-btn-gold">
                    🔥 Popular
                  </span>
                )}
                {selectedItem.preparation_time && (
                  <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 f-float">
                    <Clock className="w-3 h-3" />
                    {selectedItem.preparation_time}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-5 pt-4">
                <h2 className="text-[22px] font-semibold text-gray-900 leading-tight">{selectedItem.name}</h2>
                {selectedItem.description && (
                  <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">{selectedItem.description}</p>
                )}

                {/* Price + action */}
                <div className="flex items-end justify-between gap-3 mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">₦{Number(selectedItem.price || 0).toLocaleString()}</span>
                    {selectedItem.slashed_price > 0 && (
                      <span className="text-sm text-gray-400 line-through">₦{Number(selectedItem.slashed_price).toLocaleString()}</span>
                    )}
                  </div>

                  {getItemQuantity(selectedItem.id) === 0 ? (
                    <button
                      onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                      disabled={!isOpen}
                      className="h-11 px-6 rounded-xl text-sm font-semibold disabled:opacity-50 press"
                      style={{ backgroundColor: isOpen ? '#F5B700' : '#E5E7EB', color: '#111111' }}
                    >
                      {isOpen ? 'ADD TO ORDER +' : 'Closed'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl p-1 f-tint-gold">
                      <button
                        onClick={() => updateQuantity(selectedItem.id, -1)}
                        aria-label="Remove one"
                        className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm press bg-fooda-gold"
                      >
                        <Minus className="w-4 h-4 f-on-gold" />
                      </button>
                      <span className="font-bold w-6 text-center text-[15px] f-on-gold">{getItemQuantity(selectedItem.id)}</span>
                      <button
                        onClick={() => addToCart(selectedItem)}
                        disabled={!isOpen}
                        aria-label="Add one"
                        className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm disabled:opacity-50 press bg-fooda-gold"
                      >
                        <Plus className="w-4 h-4 f-on-gold" />
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

      {/* Sticky order bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full max-w-2xl mx-auto h-14 rounded-2xl flex items-center gap-3 px-3 shadow-lg press f-btn-gold"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 bg-green-700 text-white"
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
            <span className="text-[14px] font-medium">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} • ₦{cartTotal.toLocaleString()}
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-[13px] font-semibold">
              VIEW ORDER <ChevronRight className="w-4 h-4" />
            </span>
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