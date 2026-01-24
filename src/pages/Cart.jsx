import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FloatingMenu from '../components/customer/FloatingMenu';
import { LanguageProvider } from '../components/LanguageContext';

function CartContent() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

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

  const removeItem = (itemId) => {
    const newCart = cart.filter(i => i.item_id !== itemId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = cart.length > 0 ? 500 : 0;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-sm text-gray-500">{cart.length} items</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Add some delicious food to get started</p>
              <Link to={createPageUrl('CustomerHome')}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                  Browse Restaurants
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Cart Items</h2>
                <Button variant="outline" onClick={clearCart} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              {cart.map((item) => (
                <Card key={item.item_id} className="border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt="" 
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-orange-100 flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-orange-600" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.restaurant_name}</p>
                        <p className="text-orange-600 font-bold mt-2">
                          ₦{item.price?.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.item_id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.item_id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => updateQuantity(item.item_id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <p className="font-bold text-gray-900">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-gray-100 sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>₦{delivery.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>₦{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Link to={createPageUrl('Checkout')}>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 h-12">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Floating Menu */}
      <FloatingMenu cartCount={cart.length} />
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