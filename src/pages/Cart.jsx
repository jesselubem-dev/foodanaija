import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LanguageProvider } from '../components/LanguageContext';
import BottomNav from '../components/customer/BottomNav';
import { usePlatformSettings } from '../hooks/usePlatformSettings';

function CartContent() {
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

  const removeItem = (itemId) => {
    const newCart = cart.filter(i => i.item_id !== itemId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success('Item removed');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = cart.length > 0 ? settings.delivery_fee : 0;
  const servicefee = cart.length > 0 ? calculateTotalVAS(cart) : 0;
  const total = subtotal + delivery + servicefee;

  // Group items by restaurant
  const byRestaurant = {};
  cart.forEach(item => {
    if (!byRestaurant[item.restaurant_id]) byRestaurant[item.restaurant_id] = { name: item.restaurant_name, items: [] };
    byRestaurant[item.restaurant_id].items.push(item);
  });

  return (
    <div className="min-h-screen bg-[#F8F7F5] pb-36">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('CustomerHome')} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {isLoadingCart ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
              <ShoppingBag className="w-10 h-10 text-orange-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-400 text-sm mb-6">Add some delicious food to get started</p>
            <Link to={createPageUrl('CustomerHome')}>
              <Button className="bg-orange-500 hover:bg-orange-600 rounded-full px-6">Browse Restaurants</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Clear cart */}
            <div className="flex justify-end mb-4">
              <button onClick={clearCart} className="text-sm text-red-500 font-medium flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>

            {/* Items grouped by restaurant */}
            <div className="space-y-4 mb-5">
              {Object.entries(byRestaurant).map(([restaurantId, { name, items }]) => (
                <div key={restaurantId} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{name}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(item => (
                      <div key={item.item_id} className="flex items-center gap-3 p-4">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                          <p className="text-orange-600 font-bold text-sm mt-0.5">₦{item.price?.toLocaleString()}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button onClick={() => removeItem(item.item_id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1.5 py-1">
                            <button onClick={() => updateQuantity(item.item_id, -1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <Minus className="w-3 h-3 text-orange-500" />
                            </button>
                            <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.item_id, 1)} className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-gray-700">₦{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium text-gray-800">₦{delivery.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="font-medium text-gray-800">₦{servicefee.toLocaleString()}</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600 text-lg">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent z-30">
          <Link to={createPageUrl('Checkout')}>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 rounded-2xl h-14 text-base font-bold shadow-xl shadow-orange-200">
              Proceed to Checkout · ₦{total.toLocaleString()}
            </Button>
          </Link>
        </div>
      )}

      <BottomNav />
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