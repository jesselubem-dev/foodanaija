import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, ChefHat, Clock, Users, CheckCircle, Phone, Calendar, DollarSign } from 'lucide-react';
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
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading chef profile...</p>
      </div>
    </div>
  );

  if (bookingSuccess) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-3xl p-10 shadow-xl max-w-sm w-full">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-green-500/30">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Sent! 🎉</h2>
        <p className="text-gray-500 mb-1">Your request has been sent to</p>
        <p className="font-bold text-gray-800 text-lg mb-4">{chef.full_name}</p>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">The chef will review your request and contact you shortly to confirm details.</p>
        <Link to={createPageUrl('Chefs')}>
          <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-12 rounded-2xl font-bold shadow-lg shadow-orange-500/25">
            Browse More Chefs
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Hero Image */}
      <div className="relative h-80">
        {chef.profile_image_url
          ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center">
              <ChefHat className="w-28 h-28 text-orange-400" />
            </div>
        }
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Back button */}
        <Link to={createPageUrl('Chefs')} className="absolute top-12 left-4">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <ArrowLeft className="w-4 h-4 text-gray-800" />
          </button>
        </Link>

        {/* Availability badge */}
        {chef.is_available && (
          <div className="absolute top-12 right-4">
            <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Available Now
            </span>
          </div>
        )}

        {/* Chef name + info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-3xl font-bold text-white mb-2">{chef.full_name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/90">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{chef.city}</span>
            </div>
            <div className="w-1 h-1 bg-white/50 rounded-full" />
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm">Same day cooking</span>
            </div>
            {chef.rating > 0 && (
              <>
                <div className="w-1 h-1 bg-white/50 rounded-full" />
                <div className="flex items-center gap-1 bg-amber-500/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span className="text-sm font-bold text-white">{chef.rating}</span>
                  <span className="text-xs text-white/80">({chef.total_reviews})</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* White card that sits on top of image */}
      <div className="relative z-10 bg-gray-50 rounded-t-3xl -mt-4 px-4 pt-6 space-y-5">

        {/* Cuisine Tags */}
        {chef.cuisine_types?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chef.cuisine_types.map(c => (
              <span key={c} className="px-4 py-1.5 bg-white text-orange-600 rounded-full text-sm font-semibold border border-orange-200 shadow-sm">{c}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-xl mb-1">🍽️</div>
            <p className="text-xs text-gray-500 leading-tight">Meals<br />Available</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{chef.capacity_examples?.length || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-xl mb-1">⭐</div>
            <p className="text-xs text-gray-500 leading-tight">Rating</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{chef.rating > 0 ? chef.rating : 'New'}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <div className="text-xl mb-1">💰</div>
            <p className="text-xs text-gray-500 leading-tight">Starting</p>
            <p className="text-xs font-bold text-green-700 mt-1">{chef.price_range?.split(' - ')[0] || '—'}</p>
          </div>
        </div>

        {/* About */}
        {chef.bio && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-sm">👨‍🍳</span>
              About {chef.full_name.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{chef.bio}</p>
          </div>
        )}

        {/* Meals & Capacity */}
        {chef.capacity_examples?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-sm">🍽️</span>
              Meals & Capacity
            </h2>
            <div className="space-y-2">
              {chef.capacity_examples.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">🍳</div>
                  <span className="text-sm text-gray-700 font-medium">{ex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        {chef.price_range && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-green-500/20">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-xs text-white/80 font-medium">Price Range</p>
              <p className="text-xl font-bold text-white">{chef.price_range}</p>
            </div>
          </div>
        )}

        {/* Book Button */}
        {!showForm ? (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-14 text-base font-bold rounded-2xl shadow-xl shadow-orange-500/30"
            >
              📅 Book This Chef
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4">
              <h2 className="font-bold text-white text-lg">📝 Booking Details</h2>
              <p className="text-white/80 text-xs mt-0.5">Fill in your details and we'll send your request</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Personal Info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Info</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                  <Input placeholder="Your Name" value={booking.customer_name}
                    onChange={e => setBooking(b => ({ ...b, customer_name: e.target.value }))}
                    className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📱</span>
                  <Input placeholder="Phone Number" value={booking.customer_phone}
                    onChange={e => setBooking(b => ({ ...b, customer_phone: e.target.value }))}
                    className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
                  <Input placeholder="Cooking / Delivery Address *" value={booking.delivery_address}
                    onChange={e => setBooking(b => ({ ...b, delivery_address: e.target.value }))}
                    required className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11" />
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">When</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Date *</label>
                    <Input type="date" value={booking.booking_date}
                      onChange={e => setBooking(b => ({ ...b, booking_date: e.target.value }))}
                      required className="bg-gray-50 border-gray-200 rounded-xl h-11" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Time</label>
                    <Input type="time" value={booking.booking_time}
                      onChange={e => setBooking(b => ({ ...b, booking_time: e.target.value }))}
                      className="bg-gray-50 border-gray-200 rounded-xl h-11" />
                  </div>
                </div>
              </div>

              {/* Meal Details */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meal Details</p>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">What do you want cooked? *</label>
                  <textarea
                    placeholder="e.g. Egusi soup with assorted meat, jollof rice for 8 people and puff puff..."
                    value={booking.meal_description}
                    onChange={e => setBooking(b => ({ ...b, meal_description: e.target.value }))}
                    className="w-full h-28 px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">No. of people</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👥</span>
                      <Input type="number" placeholder="e.g. 10" value={booking.number_of_people}
                        onChange={e => setBooking(b => ({ ...b, number_of_people: e.target.value }))}
                        className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-11" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Budget (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                      <Input type="number" placeholder="e.g. 20000" value={booking.budget}
                        onChange={e => setBooking(b => ({ ...b, budget: e.target.value }))}
                        className="pl-7 bg-gray-50 border-gray-200 rounded-xl h-11" />
                    </div>
                  </div>
                </div>
                <Input placeholder="Dietary notes or special requests (optional)" value={booking.notes}
                  onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                  className="bg-gray-50 border-gray-200 rounded-xl h-11" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                  className="flex-1 h-12 rounded-2xl border-gray-200 text-gray-600">
                  Cancel
                </Button>
                <Button type="submit" disabled={bookMutation.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-2xl font-bold shadow-lg shadow-orange-500/25">
                  {bookMutation.isPending ? (
                    <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sending...</span>
                  ) : 'Send Request 🚀'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}