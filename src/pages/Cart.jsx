import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCart(savedCart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    
    const newCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem('foodanaija_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    localStorage.setItem('foodanaija_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem('foodanaija_cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Cart cleared');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cart.length > 0 ? 500 : 0;
  const total = subtotal + deliveryFee;

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate(createPageUrl('Checkout'));
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious items to get started</p>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8"
          >
            Browse Restaurants
          </Button>
        </div>
      </div>
    );
  }

  // Group items by restaurant
  const itemsByRestaurant = cart.reduce((acc, item) => {
    const restaurantId = item.restaurant_id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurant_name: item.restaurant_name,
        items: []
      };
    }
    acc[restaurantId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Clear All
        </Button>
      </div>

      {/* Cart Items by Restaurant */}
      <div className="space-y-6 mb-6">
        {Object.entries(itemsByRestaurant).map(([restaurantId, data]) => (
          <div key={restaurantId} className="bg-white rounded-2xl border border-emerald-50 overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <h3 className="font-semibold text-gray-900">{data.restaurant_name}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.items.map(item => (
                <div key={item.id} className="p-4 flex gap-4">
                  <img 
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} 
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-emerald-600 font-bold mb-3">₦{item.price?.toLocaleString()}</p>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-emerald-50 rounded-full px-1 py-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-7 w-7 rounded-full hover:bg-emerald-100"
                        >
                          <Minus className="w-3 h-3 text-emerald-700" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 rounded-full hover:bg-emerald-100"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                        </Button>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Summary */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-emerald-100 p-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="font-semibold">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-emerald-600">₦{total.toLocaleString()}</span>
            </div>
          </div>
          
          <Button 
            onClick={proceedToCheckout}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/20"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}