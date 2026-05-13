import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import DrinkUpsell from '../components/customer/DrinkUpsell';
import ErrorBoundary from '../components/ErrorBoundary';
// VAS tier per restaurant subtotal
const getVASForSubtotal = (subtotal) => {
  if (subtotal >= 25000) return 3000;
  if (subtotal >= 10000) return 1500;
  if (subtotal >= 5000) return 700;
  return 300;
};

const calculateTotalVAS = (cartItems) => {
  const byRestaurant = {};
  cartItems.forEach(item => {
    if (!byRestaurant[item.restaurant_id]) byRestaurant[item.restaurant_id] = 0;
    byRestaurant[item.restaurant_id] += item.price * item.quantity;
  });
  return Object.values(byRestaurant).reduce((sum, sub) => sum + getVASForSubtotal(sub), 0);
};

const PAYSTACK_PUBLIC_KEY = 'pk_live_28be62d297dc4c38fcefe733d62af20942364d4a';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
    loadPaystackScript();
  }, []);

  const loadPaystackScript = () => {
    if (document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onerror = () => {
      toast.error('Payment system failed to load');
    };
    document.head.appendChild(script);
  };

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Fetch saved addresses
      const savedAddresses = await base44.entities.SavedAddress.filter({ 
        user_email: userData.email 
      });
      
      // Get default address or first address
      const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      
      setFormData(prev => ({
        ...prev,
        customer_name: userData.full_name || '',
        customer_email: userData.email || '',
        delivery_address: defaultAddress?.address || ''
      }));
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const handleAddDrink = (drink, delta) => {
    setSelectedDrinks(prev => {
      const existing = prev.find(d => d.id === drink.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(d => d.id !== drink.id);
        }
        return prev.map(d => d.id === drink.id ? { ...d, quantity: newQuantity } : d);
      } else if (delta > 0) {
        return [...prev, { ...drink, quantity: delta }];
      }
      return prev;
    });
  };



  const verifyPaymentAsync = async (reference, ordersData) => {
    try {
      const result = await base44.functions.invoke('verifyPayment', {
        reference,
        ordersData
      });

      if (result.data?.success) {
        localStorage.removeItem('cart');
        setShowSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          window.location.href = createPageUrl('OrderHistory');
        }, 3000);
      } else {
        toast.error(result.data?.message || 'Payment verification failed');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
      setProcessing(false);
    }
  };

  const initiatePayment = (email, amount, reference, ordersData) => {
    if (!window.PaystackPop) {
      toast.error('Payment system not loaded - try refreshing the page');
      setProcessing(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100,
      currency: 'NGN',
      ref: reference,
      onClose: () => {
        setProcessing(false);
        toast.info('Payment cancelled');
      },
      callback: (response) => {
        verifyPaymentAsync(response.reference, ordersData);
      }
    });

    handler.openIframe();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.delivery_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate phone number
    if (!/^[0-9]{10,11}$/.test(formData.customer_phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error('Please enter a valid email address');
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
    
    // Calculate total food + drinks
    const foodTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const drinksTotal = selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);

    // Prepare order data (without drinks)
    const ordersData = restaurants.map(restaurant => {
      const restaurantFoodTotal = restaurant.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = 800;
      const restaurantVAS = getVASForSubtotal(restaurantFoodTotal);
      const orderTotal = restaurantFoodTotal + deliveryFee + restaurantVAS;

      return {
        restaurant_id: restaurant.restaurant_id,
        restaurant_name: restaurant.restaurant_name,
        customer_email: formData.customer_email,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        items: restaurant.items,
        subtotal: restaurantFoodTotal,
        delivery_fee: deliveryFee,
        service_fee: restaurantVAS,
        total: orderTotal,
        notes: formData.notes,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'card',
        batch_order_id: restaurants.length > 1 ? batchOrderId : null,
        total_restaurants_in_batch: restaurants.length
      };
    });

    // Add drink order data if drinks selected
    if (selectedDrinks.length > 0) {
      ordersData.push({
        isDrinkOrder: true,
        customer_email: formData.customer_email,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        drinks: selectedDrinks.map(drink => ({
          drink_id: drink.id,
          name: drink.name,
          price: drink.price,
          quantity: drink.quantity,
          image_url: drink.image_url
        })),
        total: drinksTotal,
        status: 'pending',
        payment_status: 'pending',
        batch_order_id: batchOrderId
      });
    }

    const totalAmount = ordersData.reduce((sum, order) => sum + order.total, 0);
    const reference = `PAY_${Date.now()}`;
    
    initiatePayment(formData.customer_email, totalAmount, reference, ordersData);
  };

  // Group by restaurant to calculate totals
  const itemsByRestaurant = {};
  cart.forEach(item => {
    if (!itemsByRestaurant[item.restaurant_id]) {
      itemsByRestaurant[item.restaurant_id] = [];
    }
    itemsByRestaurant[item.restaurant_id].push(item);
  });
  
  const restaurantCount = Object.keys(itemsByRestaurant).length;
  const foodSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const drinksSubtotal = selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);
  const subtotal = foodSubtotal + drinksSubtotal;
  const deliveryFee = restaurantCount * 800;
  const valueAddedService = calculateTotalVAS(cart);
  
  const total = subtotal + deliveryFee + valueAddedService;

  if (cart.length === 0) {
    return (
      <ErrorBoundary>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <Link to={createPageUrl('CustomerHome')}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Browse Restaurants
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Cart')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drinks Upsell */}
            <DrinkUpsell onAddDrink={handleAddDrink} selectedDrinks={selectedDrinks} />
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <Input
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">
                    Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <Input
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    placeholder="e.g. 0801234567"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">
                    Delivery Address *
                  </label>
                  <Textarea
                    required
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    placeholder="Enter your delivery address"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">Special Instructions (Optional)</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special requests..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-gray-100 sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.item_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}

                {selectedDrinks.length > 0 && (
                  <div className="pt-2 border-t">
                    {selectedDrinks.map((drink) => (
                      <div key={drink.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          🥤 {drink.name} x{drink.quantity}
                        </span>
                        <span className="font-medium text-orange-600">
                          ₦{(drink.price * drink.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee {restaurantCount > 1 ? `(${restaurantCount} restaurants)` : ''}</span>
                    <span>₦{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Value Added Service {restaurantCount > 1 ? `(${restaurantCount}x)` : ''}</span>
                    <span>₦{valueAddedService.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 h-12"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Pay ₦' + total.toLocaleString()}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full animate-bounce">
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
    </ErrorBoundary>
  );
}