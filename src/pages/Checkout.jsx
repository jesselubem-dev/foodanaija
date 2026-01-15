import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
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

  const createOrderMutation = useMutation({
    mutationFn: async ({ ordersData }) => {
      // Paystack payment handled in handleSubmit
      return { paymentRequired: true, ordersData };
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast.error('Failed to place order. Please try again.');
    },
  });

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
    
    // Create separate order for each restaurant
    try {
      for (const restaurant of restaurants) {
        const subtotal = restaurant.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 500;
        const valueAddedService = 300;
        const total = subtotal + deliveryFee + valueAddedService;

        await base44.entities.Order.create({
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
          payment_method: 'cash',
          batch_order_id: restaurants.length > 1 ? batchOrderId : null,
          total_restaurants_in_batch: restaurants.length
        });
      }

      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];
      
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      localStorage.removeItem('cart');
      setShowSuccess(true);
      
      setTimeout(() => {
        window.location.href = createPageUrl('OrderHistory');
      }, 3500);
    } catch (error) {
      toast.error('Failed to create order');
    }
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
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = restaurantCount * 500;
  const valueAddedService = restaurantCount * 300;
  const total = subtotal + deliveryFee + valueAddedService;

  if (cart.length === 0) {
    return (
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
    );
  }

  return (
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
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
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
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
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
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
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
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
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
                >
                  Place Order
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