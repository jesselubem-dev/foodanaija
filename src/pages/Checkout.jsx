import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";


import DrinkUpsell from '../components/customer/DrinkUpsell';
import ErrorBoundary from '../components/ErrorBoundary';
import { EASE_NATIVE } from '@/components/ui/motion';
import { usePlatformSettings } from '../hooks/usePlatformSettings';

// Dynamically loads the Flutterwave Inline checkout SDK (v3.js) once.
function loadFlutterwaveSDK() {
  return new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) return resolve();
    const existing = document.getElementById('flw-inline-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load payment SDK')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'flw-inline-sdk';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment SDK'));
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { settings, getVASForSubtotal, calculateTotalVAS } = usePlatformSettings();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
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

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      const codes = await base44.entities.PromoCode.filter({ 
        code: promoCode.toUpperCase() 
      });

      if (codes.length === 0) {
        setPromoError('Invalid promo code');
        setPromoLoading(false);
        return;
      }

      const code = codes[0];

      // Check if active
      if (!code.is_active) {
        setPromoError('This code is no longer active');
        setPromoLoading(false);
        return;
      }

      // Check if expired
      if (code.valid_until && new Date(code.valid_until) < new Date()) {
        setPromoError('This code has expired');
        setPromoLoading(false);
        return;
      }

      // Check if not valid yet
      if (code.valid_from && new Date(code.valid_from) > new Date()) {
        setPromoError('This code is not yet valid');
        setPromoLoading(false);
        return;
      }

      // Check usage limit
      if (code.max_usage > 0 && code.current_usage >= code.max_usage) {
        setPromoError('This code has reached its usage limit');
        setPromoLoading(false);
        return;
      }

      // Check personalised code restriction
      if (code.is_personalised && code.assigned_user_email) {
        if (!user || user.email.toLowerCase() !== code.assigned_user_email.toLowerCase()) {
          setPromoError('This code is not valid for your account');
          setPromoLoading(false);
          return;
        }
      }

      // Check minimum order
      const itemsByRestaurant = {};
      cart.forEach(item => {
        if (!itemsByRestaurant[item.restaurant_id]) {
          itemsByRestaurant[item.restaurant_id] = [];
        }
        itemsByRestaurant[item.restaurant_id].push(item);
      });
      
      const foodSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const currentSubtotal = foodSubtotal + selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);

      if (code.min_order_amount && currentSubtotal < code.min_order_amount) {
        setPromoError(`Minimum order: ₦${code.min_order_amount.toLocaleString()}`);
        setPromoLoading(false);
        return;
      }

      setAppliedPromo(code);
      setPromoCode('');
    } catch (error) {
      setPromoError('Failed to apply code. Please try again.');
    }

    setPromoLoading(false);
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
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
       const deliveryFee = settings.delivery_fee;
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
         promo_code_id: appliedPromo?.id || null,
         promo_code: appliedPromo?.code || null,
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

    let totalAmount = ordersData.reduce((sum, order) => sum + order.total, 0);

    // Apply promo discount to payment amount
    if (appliedPromo) {
      const totalFoodSubtotal = foodTotal + drinksTotal;
      const totalDeliveryFee = restaurants.length * settings.delivery_fee;
      const totalVAS = calculateTotalVAS(cart);
      if (appliedPromo.discount_type === 'percentage') {
        const discountAmount = Math.floor(totalFoodSubtotal * (appliedPromo.discount_value / 100));
        totalAmount -= discountAmount;
      } else if (appliedPromo.discount_type === 'fixed') {
        totalAmount -= appliedPromo.discount_value;
      } else if (appliedPromo.discount_type === 'free_delivery' || appliedPromo.is_free_delivery) {
        totalAmount -= (totalDeliveryFee + totalVAS);
      }
    }

    const reference = `PAY_${Date.now()}`;

    // Save an "initiated" order snapshot BEFORE Flutterwave checkout opens
    // so admins can see incomplete/abandoned checkouts
    try {
      for (const orderData of ordersData) {
        if (!orderData.isDrinkOrder) {
          await base44.entities.Order.create({
            restaurant_id: orderData.restaurant_id,
            restaurant_name: orderData.restaurant_name,
            customer_email: formData.customer_email,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            delivery_address: formData.delivery_address,
            items: orderData.items,
            subtotal: orderData.subtotal,
            delivery_fee: orderData.delivery_fee,
            total: orderData.total,
            notes: formData.notes,
            status: 'pending',
            payment_status: 'initiated',
            payment_method: 'card',
            payment_reference: reference,
            amount_paid: 0,
            batch_order_id: orderData.batch_order_id || null,
            total_restaurants_in_batch: orderData.total_restaurants_in_batch || 1,
          });
        }
      }
    } catch (snapshotErr) {
      console.warn('Could not save initiated order snapshot:', snapshotErr);
    }

    // Save the order snapshot so the verification page can finalize the orders after redirect
    try {
      localStorage.setItem('pending_payment', JSON.stringify({ tx_ref: reference, ordersData }));
    } catch (e) {
      console.warn('Could not save pending payment snapshot:', e);
    }

    try {
      const initRes = await base44.functions.invoke('initiateFlutterwavePayment', {
        tx_ref: reference
      });
      if (!initRes.data?.success || !initRes.data?.public_key) {
        toast.error(initRes.data?.error || 'Could not start payment. Please try again.');
        setProcessing(false);
        return;
      }

      // Load the Flutterwave Inline SDK and open the checkout modal in-app
      await loadFlutterwaveSDK();

      const modal = window.FlutterwaveCheckout({
        public_key: initRes.data.public_key,
        tx_ref: reference,
        amount: totalAmount,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer,account,mobilemoney',
        customer: {
          email: formData.customer_email,
          phonenumber: formData.customer_phone,
          name: formData.customer_name
        },
        customizations: {
          title: 'Fooda Naija',
          description: 'Order payment',
          logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png'
        },
        callback: function (payment) {
          if (modal) modal.close();
          if (payment && payment.transaction_id) {
            window.location.href = createPageUrl('OrderConfirmation') + `?transaction_id=${payment.transaction_id}`;
          } else {
            setProcessing(false);
            toast.error('Payment not completed. Please try again.');
          }
        },
        onclose: function () {
          setProcessing(false);
        }
      });
    } catch (initError) {
      console.error('Failed to initiate payment:', initError);
      toast.error('Could not start payment. Please try again.');
      setProcessing(false);
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
  const foodSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const drinksSubtotal = selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);
  const subtotal = foodSubtotal + drinksSubtotal;
  const deliveryFee = restaurantCount * settings.delivery_fee;
  const valueAddedService = calculateTotalVAS(cart);
  
  // Calculate promo discount
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      promoDiscount = Math.floor(subtotal * (appliedPromo.discount_value / 100));
    } else if (appliedPromo.discount_type === 'fixed') {
      promoDiscount = appliedPromo.discount_value;
    } else if (appliedPromo.discount_type === 'free_delivery' || appliedPromo.is_free_delivery) {
      promoDiscount = deliveryFee + valueAddedService;
    }
  }
  
  const total = subtotal + deliveryFee + valueAddedService - promoDiscount;

  const fieldClass = "h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold";
  const labelClass = "block text-[13px] font-medium text-gray-900 mb-1.5";

  if (cart.length === 0) {
    return (
      <ErrorBoundary>
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_NATIVE }}
          className="text-center"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your order is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add some food before checking out</p>
          <Link
            to={createPageUrl('CustomerHome')}
            className="inline-flex h-11 px-6 rounded-xl text-sm font-semibold items-center press f-btn-gold"
          >
            Browse restaurants
          </Link>
        </motion.div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <div className="max-w-lg mx-auto relative flex items-center justify-center h-10">
          <Link
            to={createPageUrl('Cart')}
            aria-label="Back to your order"
            className="absolute left-0 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center press"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </Link>
          <h1 className="text-[17px] font-semibold text-gray-900">Checkout</h1>
        </div>
      </header>

      <form id="checkout-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4">
        <h2 className="text-[15px] font-semibold text-gray-900 text-center mt-2 mb-4">Delivery details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="co-name" className={labelClass}>Full name</label>
            <Input
              id="co-name"
              required
              autoComplete="name"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-email" className={labelClass}>Email</label>
            <Input
              id="co-email"
              required
              type="email"
              autoComplete="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-phone" className={labelClass}>Phone number</label>
            <Input
              id="co-phone"
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              placeholder="e.g. 08012345678"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-address" className={labelClass}>Delivery address</label>
            <Input
              id="co-address"
              required
              autoComplete="street-address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-notes" className={labelClass}>Special instruction</label>
            <Textarea
              id="co-notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional — e.g. no pepper, call when you arrive"
              className="min-h-[96px] rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
            />
          </div>

          {/* Promo code */}
          <div>
            <label htmlFor="co-promo" className={labelClass}>Promo code</label>
            <AnimatePresence mode="wait">
            {appliedPromo ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_NATIVE }}
                className="rounded-xl border p-3 flex items-start justify-between gap-3 f-tint-green f-border-green"
              >
                <div className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 mt-0.5 f-text-green" />
                  <div>
                    <p className="font-semibold text-[14px] f-on-gold">{appliedPromo.code}</p>
                    <p className="text-[12px] mt-0.5 f-text-green">
                      {(appliedPromo.discount_type === 'free_delivery' || appliedPromo.is_free_delivery) ? 'Free delivery & service fee' :
                       appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% off` :
                       `₦${Number(appliedPromo.discount_value).toLocaleString()} off`}
                    </p>
                    {appliedPromo.description && (
                      <p className="text-[11px] mt-0.5 f-text-muted">{appliedPromo.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePromoCode}
                  aria-label="Remove promo code"
                  className="p-1 f-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_NATIVE }}
              >
                <div className="flex gap-2.5">
                  <Input
                    id="co-promo"
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); } }}
                    className={`${fieldClass} flex-1 uppercase`}
                  />
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                    className="h-12 px-5 rounded-xl text-[12px] font-semibold uppercase tracking-wide disabled:opacity-60 press f-btn-gold"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-[12px] mt-1.5 f-text-red">{promoError}</p>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Drinks upsell (existing feature) */}
        <div className="mt-6">
          <DrinkUpsell onAddDrink={handleAddDrink} selectedDrinks={selectedDrinks} />
        </div>

        {/* Order summary */}
        <div className="mt-6 rounded-2xl border p-4 f-border-gold">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Order summary</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal{drinksSubtotal > 0 ? ' (incl. drinks)' : ''}</span>
              <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Service charge</span>
              <span className="text-gray-900">₦{valueAddedService.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Delivery{restaurantCount > 1 ? ` (${restaurantCount} restaurants)` : ''}</span>
              <span className="text-gray-900">₦{deliveryFee.toLocaleString()}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between">
                <span className="font-medium f-text-green">Promo discount</span>
                <span className="font-medium f-text-green">-₦{promoDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 text-[16px]">
              <span className="font-bold text-gray-900">Total</span>
              <motion.span
                key={total}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                className="font-bold text-gray-900 origin-right inline-block"
              >
                ₦{total.toLocaleString()}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Place order */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            disabled={processing}
            className="w-full max-w-lg mx-auto h-14 rounded-2xl flex items-center justify-center gap-1 text-[14px] font-semibold uppercase tracking-wide disabled:opacity-70 f-btn-gold"
          >
            {processing ? 'Processing...' : <>Place order · ₦{total.toLocaleString()} <ChevronRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </form>
    </div>
    </ErrorBoundary>
  );
}
