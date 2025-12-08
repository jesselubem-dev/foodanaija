import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, CreditCard, Building2, Phone as PhoneIcon, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    payment_method: 'card'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedCart = JSON.parse(localStorage.getItem('foodanaija_cart') || '[]');
    setCart(savedCart);

    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.full_name || '',
        email: userData.email || ''
      }));
    } catch (e) {
      // Not logged in - they can still checkout as guest
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Group items by restaurant and create separate orders
      const itemsByRestaurant = cart.reduce((acc, item) => {
        const restaurantId = item.restaurant_id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant_id: restaurantId,
            restaurant_name: item.restaurant_name,
            items: []
          };
        }
        acc[restaurantId].items.push({
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url
        });
        return acc;
      }, {});

      // Create orders for each restaurant
      const orderPromises = Object.values(itemsByRestaurant).map(orderData => {
        const orderSubtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return base44.entities.Order.create({
          restaurant_id: orderData.restaurant_id,
          restaurant_name: orderData.restaurant_name,
          customer_email: formData.email || user?.email,
          customer_name: formData.name,
          customer_phone: formData.phone,
          delivery_address: formData.address,
          items: orderData.items,
          subtotal: orderSubtotal,
          delivery_fee: deliveryFee,
          total: orderSubtotal + deliveryFee,
          status: 'pending',
          payment_method: formData.payment_method,
          payment_status: formData.payment_method === 'cash' ? 'pending' : 'paid',
          notes: formData.notes
        });
      });

      await Promise.all(orderPromises);

      // Clear cart
      localStorage.setItem('foodanaija_cart', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));

      toast.success('Order placed successfully!');
      navigate(createPageUrl('Orders'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-emerald-600 hover:bg-emerald-700">
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Details */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="08012345678"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your full delivery address"
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special requests or delivery instructions"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
          
          <RadioGroup value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
            <div className="space-y-3">
              <PaymentOption value="card" icon={CreditCard} label="Card Payment" desc="Pay with your debit/credit card" />
              <PaymentOption value="transfer" icon={Building2} label="Bank Transfer" desc="Transfer to our account" />
              <PaymentOption value="ussd" icon={PhoneIcon} label="USSD" desc="Pay using USSD code" />
              <PaymentOption value="cash" icon={Banknote} label="Cash on Delivery" desc="Pay when you receive" />
            </div>
          </RadioGroup>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} x {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2">
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
        </div>

        {/* Submit Button */}
        <Button 
          type="submit"
          disabled={isProcessing}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/20"
        >
          {isProcessing ? 'Processing...' : `Place Order - ₦${total.toLocaleString()}`}
        </Button>
      </form>
    </div>
  );
}

function PaymentOption({ value, icon: Icon, label, desc }) {
  return (
    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-emerald-300 cursor-pointer transition-colors">
      <RadioGroupItem value={value} id={value} />
      <Label htmlFor={value} className="flex items-center gap-3 flex-1 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </Label>
    </div>
  );
}