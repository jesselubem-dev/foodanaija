import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ChefHat, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from "sonner";
import confetti from 'canvas-confetti';
import FloatingMenu from '../components/customer/FloatingMenu';

const PAYSTACK_PUBLIC_KEY = 'pk_live_28be62d297dc4c38fcefe733d62af20942364d4a';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
    
    // Load Paystack script
    if (!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      document.head.appendChild(script);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        customer_name: userData.full_name || '',
        customer_email: userData.email || ''
      }));
      
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

  const handleProceedToCheckout = () => {
    setShowForm(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.delivery_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!window.PaystackPop) {
      toast.error('Payment system loading, please try again');
      return;
    }
    
    setProcessing(true);

    // Group cart items by restaurant
    const itemsByRestaurant = {};
    cart.forEach(item => {
      if (!itemsByRestaurant[item.restaurant_id]) {
        itemsByRestaurant[item.restaurant_id] = {
          restaurant_id: item.restaurant_id,
          restaurant_name: item.restaurant_name,
          items: []
        };
      }
      itemsByRestaurant[item.restaurant_id].items.push(item);
    });

    const restaurants = Object.values(itemsByRestaurant);
    const batchOrderId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const ordersData = restaurants.map(restaurant => {
      const subtotal = restaurant.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = 500;
      const valueAddedService = 300;
      const total = subtotal + deliveryFee + valueAddedService;

      return {
        restaurant_id: restaurant.restaurant_id,
        restaurant_name: restaurant.restaurant_name,
        customer_email: formData.customer_email,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        items: restaurant.items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        notes: formData.notes,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'card',
        batch_order_id: restaurants.length > 1 ? batchOrderId : null,
        total_restaurants_in_batch: restaurants.length
      };
    });

    const totalAmount = ordersData.reduce((sum, order) => sum + order.total, 0);
    const reference = `PAY_${Date.now()}`;
    
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: formData.customer_email,
      amount: totalAmount * 100,
      currency: 'NGN',
      ref: reference,
      onClose: function() {
        setProcessing(false);
        toast.info('Payment cancelled');
      },
      callback: async function(response) {
        try {
          const result = await base44.functions.invoke('verifyPayment', { 
            reference: response.reference,
            ordersData: ordersData
          });
          
          if (result.data.success) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            
            localStorage.removeItem('cart');
            setShowForm(false);
            setShowSuccess(true);
            
            setTimeout(() => {
              window.location.href = createPageUrl('OrderHistory');
            }, 3000);
          } else {
            toast.error('Payment verification failed');
            setProcessing(false);
          }
        } catch (error) {
          toast.error('Payment verification failed');
          setProcessing(false);
        }
      }
    });
    
    handler.openIframe();
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

                  <Button 
                    onClick={handleProceedToCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 h-12"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Floating Menu */}
      <FloatingMenu cartCount={cart.length} />

      {/* Checkout Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handlePayment} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
            
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                required
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="e.g. 0801234567"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Delivery Address *</label>
              <Textarea
                required
                value={formData.delivery_address}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                placeholder="Enter your delivery address"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Special Instructions (Optional)</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special requests..."
                className="min-h-[60px]"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-4">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 h-12"
                disabled={processing}
              >
                {processing ? 'Opening Payment...' : 'Pay ₦' + total.toLocaleString()}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-orange-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
            <p className="text-gray-600 mb-4">
              Your order has been successfully sent to the restaurant
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800 font-medium">
                ✓ Restaurant will review your order shortly
              </p>
              <p className="text-xs text-orange-700 mt-1">
                You'll receive notifications about your order status
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}