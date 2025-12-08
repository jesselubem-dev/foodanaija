import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, Minus, Plus, Trash2, ShoppingBag, 
  MapPin, CreditCard, Banknote, Smartphone, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    delivery_address: '',
    customer_phone: '',
    payment_method: 'card',
    notes: ''
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCart(savedCart);
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setOrderDetails(prev => ({
        ...prev,
        customer_phone: userData.phone || ''
      }));
    } catch (e) {}
  };

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('foodanaija_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (itemId, delta) => {
    const newCart = cart.map(item => {
      if (item.item_id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);
    updateCart(newCart);
  };

  const removeItem = (itemId) => {
    const newCart = cart.filter(item => item.item_id !== itemId);
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500; // Default delivery fee
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!orderDetails.delivery_address || !orderDetails.customer_phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Group items by restaurant
      const restaurantGroups = {};
      cart.forEach(item => {
        if (!restaurantGroups[item.restaurant_id]) {
          restaurantGroups[item.restaurant_id] = {
            restaurant_id: item.restaurant_id,
            restaurant_name: item.restaurant_name,
            items: []
          };
        }
        restaurantGroups[item.restaurant_id].items.push(item);
      });

      // Create order for each restaurant
      for (const group of Object.values(restaurantGroups)) {
        const orderSubtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await base44.entities.Order.create({
          restaurant_id: group.restaurant_id,
          restaurant_name: group.restaurant_name,
          customer_email: user.email,
          customer_name: user.full_name || user.email,
          customer_phone: orderDetails.customer_phone,
          delivery_address: orderDetails.delivery_address,
          items: group.items,
          subtotal: orderSubtotal,
          delivery_fee: deliveryFee,
          total: orderSubtotal + deliveryFee,
          status: 'pending',
          payment_method: orderDetails.payment_method,
          payment_status: 'pending',
          notes: orderDetails.notes
        });
      }

      clearCart();
      toast.success('Order placed successfully!');
      setShowCheckout(false);
      window.location.href = createPageUrl('Orders');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-center mb-6">Add some delicious Nigerian food to get started!</p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Browse Restaurants
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden mb-6">
        {cart.map((item, index) => (
          <div key={item.item_id}>
            {index > 0 && <Separator />}
            <div className="p-4 flex gap-4">
              <img 
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} 
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.restaurant_name}</p>
                <p className="font-semibold text-emerald-600 mt-1">₦{item.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button 
                  onClick={() => removeItem(item.item_id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full">
                  <button 
                    onClick={() => updateQuantity(item.item_id, -1)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.item_id, 1)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Fee</span>
            <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-emerald-600">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Button 
        onClick={() => setShowCheckout(true)}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg font-semibold"
      >
        Proceed to Checkout
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Delivery Address */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Delivery Address *
              </Label>
              <Textarea
                placeholder="Enter your full delivery address..."
                value={orderDetails.delivery_address}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, delivery_address: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={orderDetails.customer_phone}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, customer_phone: e.target.value }))}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup 
                value={orderDetails.payment_method}
                onValueChange={(value) => setOrderDetails(prev => ({ ...prev, payment_method: value }))}
                className="space-y-2"
              >
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <RadioGroupItem value="card" />
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Card Payment</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <RadioGroupItem value="transfer" />
                  <Banknote className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Bank Transfer</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <RadioGroupItem value="ussd" />
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">USSD</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <RadioGroupItem value="cash" />
                  <Banknote className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Cash on Delivery</span>
                </label>
              </RadioGroup>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special requests or instructions..."
                value={orderDetails.notes}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span>₦{deliveryFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-emerald-600">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <Button 
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? 'Placing Order...' : `Pay ₦${total.toLocaleString()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}