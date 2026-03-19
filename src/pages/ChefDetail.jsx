import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, ChefHat, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChefDetail() {
  const params = new URLSearchParams(window.location.search);
  const chefId = params.get('id');
  const [booking, setBooking] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    booking_date: '',
    booking_time: '',
    meal_description: '',
    number_of_people: '',
    budget: '',
    notes: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: chef, isLoading } = useQuery({
    queryKey: ['chef', chefId],
    queryFn: () => base44.entities.Chef.filter({ id: chefId }).then(r => r[0]),
    enabled: !!chefId,
  });

  // Pre-fill user name/phone from auth
  useEffect(() => {
    base44.auth.me().then(user => {
      setBooking(b => ({ ...b, customer_name: user.full_name || '', customer_email: user.email }));
    }).catch(() => {});
  }, []);

  const bookMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ChefBooking.create({
        ...data,
        chef_id: chefId,
        chef_name: chef.full_name,
        customer_email: user.email,
        number_of_people: Number(data.number_of_people) || 1,
        budget: Number(data.budget) || 0,
      });
    },
    onSuccess: () => {
      setBookingSuccess(true);
      setShowForm(false);
    },
    onError: () => toast.error('Failed to send booking. Please try again.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!booking.delivery_address || !booking.booking_date || !booking.meal_description) {
      toast.error('Please fill in address, date, and meal description');
      return;
    }
    bookMutation.mutate(booking);
  };

  if (isLoading || !chef) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  if (bookingSuccess) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Sent! 🎉</h2>
      <p className="text-gray-500 mb-2">Your request has been sent to <span className="font-semibold text-gray-700">{chef.full_name}</span>.</p>
      <p className="text-sm text-gray-400 mb-8">The chef will review your request and contact you shortly.</p>
      <Link to={createPageUrl('Chefs')}>
        <Button className="bg-orange-500 hover:bg-orange-600 rounded-2xl px-8">Browse More Chefs</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero */}
      <div className="relative h-72 bg-gradient-to-br from-orange-200 to-amber-200">
        {chef.profile_image_url
          ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-24 h-24 text-orange-300" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Link to={createPageUrl('Chefs')} className="absolute top-4 left-4">
          <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold">{chef.full_name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm">{chef.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm">Same day cooking</span>
            </div>
            {chef.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{chef.rating} ({chef.total_reviews || 0} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Cuisine Tags */}
        {chef.cuisine_types?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chef.cuisine_types.map(c => (
              <span key={c} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold border border-orange-100">{c}</span>
            ))}
          </div>
        )}

        {/* About */}
        {chef.bio && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="font-bold text-gray-900 mb-2">About {chef.full_name}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{chef.bio}</p>
          </div>
        )}

        {/* What I Can Cook - highlighted prominently */}
        {chef.capacity_examples?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 text-base mb-3">🍽️ Meals & Capacity</h2>
            <div className="grid gap-2">
              {chef.capacity_examples.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                  <span className="text-xl">🍳</span>
                  <span className="text-sm text-gray-800 font-medium">{ex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        {chef.price_range && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">💰</div>
            <div>
              <p className="text-xs text-gray-500">Price Range</p>
              <p className="text-lg font-bold text-green-700">{chef.price_range}</p>
            </div>
          </div>
        )}

        {/* Book Button / Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-14 text-base font-bold rounded-2xl shadow-lg shadow-orange-500/30"
          >
            📅 Book This Chef
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <h2 className="font-bold text-gray-900 text-lg">📝 Booking Details</h2>
            <Input placeholder="Your Name" value={booking.customer_name} onChange={e => setBooking(b => ({ ...b, customer_name: e.target.value }))} className="bg-white" />
            <Input placeholder="Phone Number" value={booking.customer_phone} onChange={e => setBooking(b => ({ ...b, customer_phone: e.target.value }))} className="bg-white" />
            <Input placeholder="Cooking / Delivery Address *" value={booking.delivery_address} onChange={e => setBooking(b => ({ ...b, delivery_address: e.target.value }))} required className="bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date *</label>
                <Input type="date" value={booking.booking_date} onChange={e => setBooking(b => ({ ...b, booking_date: e.target.value }))} required className="bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <Input type="time" value={booking.booking_time} onChange={e => setBooking(b => ({ ...b, booking_time: e.target.value }))} className="bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">What do you want cooked? *</label>
              <textarea
                placeholder="e.g. Egusi soup with assorted meat, jollof rice for 8 people and puff puff..."
                value={booking.meal_description}
                onChange={e => setBooking(b => ({ ...b, meal_description: e.target.value }))}
                className="w-full h-28 px-3 py-2 border border-input rounded-xl text-sm resize-none bg-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Number of people</label>
                <Input type="number" placeholder="e.g. 10" value={booking.number_of_people} onChange={e => setBooking(b => ({ ...b, number_of_people: e.target.value }))} className="bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Your budget (₦)</label>
                <Input type="number" placeholder="e.g. 20000" value={booking.budget} onChange={e => setBooking(b => ({ ...b, budget: e.target.value }))} className="bg-white" />
              </div>
            </div>
            <Input placeholder="Dietary notes (optional)" value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} className="bg-white" />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 bg-white">Cancel</Button>
              <Button type="submit" disabled={bookMutation.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold">
                {bookMutation.isPending ? 'Sending...' : 'Send Booking Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}