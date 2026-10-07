import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider } from '../components/LanguageContext';
import { EASE_NATIVE } from '@/components/ui/motion';
import { usePlatformSettings } from '../hooks/usePlatformSettings';

function CartContent() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const { settings, calculateTotalVAS } = usePlatformSettings();

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      localStorage.removeItem('cart');
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    if (newCart.length) localStorage.setItem('cart', JSON.stringify(newCart));
    else localStorage.removeItem('cart');
  };

  const updateQuantity = (itemId, delta) => {
    const target = cart.find(i => i.item_id === itemId);
    const newCart = cart.map(i => {
      if (i.item_id === itemId) {
        const q = i.quantity + delta;
        return q > 0 ? { ...i, quantity: q } : null;
      }
      return i;
    }).filter(Boolean);
    saveCart(newCart);
    if (target && target.quantity + delta <= 0) toast.success(`${target.name} removed`);
  };

  const clearCart = () => {
    saveCart([]);
    toast.success('Order cleared');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const restaurantCount = new Set(cart.map(i => i.restaurant_id)).size;
  // Same fee rules as before: platform delivery fee + tiered service fee per restaurant.
  const delivery = cart.length > 0 ? settings.delivery_fee : 0;
  const serviceFee = cart.length > 0 ? calculateTotalVAS(cart) : 0;
  const total = subtotal + delivery + serviceFee;

  // "Add more items" goes back to the restaurant of the most recently added dish.
  const lastRestaurantId = cart.length ? cart[cart.length - 1].restaurant_id : null;
  const addMoreUrl = lastRestaurantId
    ? createPageUrl(`RestaurantDetail?id=${lastRestaurantId}`)
    : createPageUrl('CustomerHome');

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('CustomerHome'));
  };

  // Group by restaurant only when the order spans more than one.
  const groups = [];
  cart.forEach(item => {
    let g = groups.find(x => x.id === item.restaurant_id);
    if (!g) { g = { id: item.restaurant_id, name: item.restaurant_name, items: [] }; groups.push(g); }
    g.items.push(item);
  });

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sticky top-0 z-30">
        <div className="max-w-lg mx-auto relative flex items-center justify-center h-10">
          <button
            onClick={goBack}
            aria-label="Back"
            className="absolute left-0 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center press"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">Your Order</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-2">
        {isLoadingCart ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_NATIVE }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: '#FFFBEB' }}>
              <ShoppingCart className="w-9 h-9" style={{ color: '#F5B700' }} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Your order is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Add some delicious food to get started</p>
            <Link
              to={createPageUrl('CustomerHome')}
              className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center press"
              style={{ backgroundColor: '#F5B700', color: '#111111' }}
            >
              Browse restaurants
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[15px] font-semibold text-gray-900">Your order</h2>
              <button onClick={clearCart} className="text-[12px] font-medium text-gray-500 hover:text-fooda-red">
                Clear all
              </button>
            </div>

            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id}>
                  {restaurantCount > 1 && (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">{group.name}</p>
                  )}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {group.items.map(item => (
                        <motion.div
                          key={item.item_id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, x: -24 }}
                          transition={{ duration: 0.24, ease: EASE_NATIVE }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-200 bg-white">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-[60px] h-[60px] rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🍽️</span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h3 className="text-[15px] font-medium text-gray-900 leading-tight truncate">{item.name}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {item.description || item.restaurant_name || ''}
                              </p>
                              <p className="text-[12px] font-medium mt-1" style={{ color: '#15803D' }}>
                                ₦{Number(item.price || 0).toLocaleString()} each
                              </p>
                            </div>

                            {/* Quantity stepper */}
                            <div
                              className="flex items-center gap-2.5 rounded-full px-1.5 py-1 flex-shrink-0"
                              style={{ backgroundColor: '#F5B700' }}
                            >
                              <button
                                onClick={() => updateQuantity(item.item_id, -1)}
                                aria-label={item.quantity === 1 ? `Remove ${item.name}` : `One less ${item.name}`}
                                className="w-7 h-7 rounded-full flex items-center justify-center press"
                                style={{ backgroundColor: '#111111' }}
                              >
                                <Minus className="w-3.5 h-3.5" style={{ color: '#ffffff' }} strokeWidth={3} />
                              </button>
                              <motion.span
                                key={item.quantity}
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                className="text-[13px] font-semibold w-4 text-center"
                                style={{ color: '#111111' }}
                              >
                                {item.quantity}
                              </motion.span>
                              <button
                                onClick={() => updateQuantity(item.item_id, 1)}
                                aria-label={`One more ${item.name}`}
                                className="w-7 h-7 rounded-full flex items-center justify-center press"
                                style={{ backgroundColor: '#111111' }}
                              >
                                <Plus className="w-3.5 h-3.5" style={{ color: '#ffffff' }} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={addMoreUrl}
              className="inline-flex items-center gap-1 mt-4 text-[12px] font-bold uppercase tracking-wide"
              style={{ color: '#15803D' }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add more items
            </Link>

            {/* Order summary */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery fee</span>
                <span className="font-medium text-gray-900">₦{delivery.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service fee</span>
                <span className="font-medium text-gray-900">₦{serviceFee.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-200 !my-3" />
              <div className="flex justify-between text-[15px]">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout button */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: EASE_NATIVE }}
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <Link
            to={createPageUrl('Checkout')}
            className="max-w-lg mx-auto h-14 rounded-2xl flex items-center justify-center gap-1 text-[14px] font-semibold uppercase tracking-wide press"
            style={{ backgroundColor: '#F5B700', color: '#111111' }}
          >
            Checkout · ₦{total.toLocaleString()} <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function Cart() {
  return (
    <LanguageProvider>
      <CartContent />
    </LanguageProvider>
  );
}
