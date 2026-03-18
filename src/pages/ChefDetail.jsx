import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, ChefHat, Calendar, Clock, Users, DollarSign } from 'lucide-react';
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

  const { data: chef, isLoading } = useQuery({
    queryKey: ['chef', chefId],
    queryFn: () => base44.entities.Chef.filter({ id: chefId }).then(r => r[0]),
    enabled: !!chefId,
  });

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
      toast.success('Booking request sent! The chef will contact you shortly.');
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

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-orange-200 to-amber-200">
        {chef.profile_image_url
          ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-24 h-24 text-orange-300" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link to={createPageUrl('Chefs')} className="absolute top-4 left-4">
          <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-2xl font-bold">{chef.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{chef.city}</span>
            {chef.rating > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{chef.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Info */}
        {chef.bio && (
          <div>
            <h2 className="font-bold text-gray-900 mb-1">About</h2>
            <p className="text-sm text-gray-600">{chef.bio}</p>
          </div>
        )}

        {chef.cuisine_types?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-2">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {chef.cuisine_types.map(c => (
                <span key={c} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">{c}</span>
              ))}
            </div>
          </div>
        )}

        {chef.capacity_examples?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-2">What I Can Cook</h2>
            <div className="space-y-2">
              {chef.capacity_examples.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-lg">🍳</span>
                  <span className="text-sm text-gray-700">{ex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chef.price_range && (
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500 mb-1">Price Range</p>
            <p className="text-xl font-bold text-green-700">{chef.price_range}</p>
          </div>
        )}

        {/* Book Button */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base rounded-2xl"
          >
            Book This Chef
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-orange-50 rounded-2xl p-4">
            <h2 className="font-bold text-gray-900 text-lg">Booking Details</h2>
            <Input placeholder="Your Name" value={booking.customer_name} onChange={e => setBooking(b => ({ ...b, customer_name: e.target.value }))} />
            <Input placeholder="Phone Number" value={booking.customer_phone} onChange={e => setBooking(b => ({ ...b, customer_phone: e.target.value }))} />
            <Input placeholder="Delivery / Cooking Address *" value={booking.delivery_address} onChange={e => setBooking(b => ({ ...b, delivery_address: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date *</label>
                <Input type="date" value={booking.booking_date} onChange={e => setBooking(b => ({ ...b, booking_date: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <Input type="time" value={booking.booking_time} onChange={e => setBooking(b => ({ ...b, booking_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Describe exactly what you want cooked *</label>
              <textarea
                placeholder="e.g. I want 2 liters of Egusi soup with assorted meat, jollof rice enough for 8 people, and puff puff for dessert..."
                value={booking.meal_description}
                onChange={e => setBooking(b => ({ ...b, meal_description: e.target.value }))}
                className="w-full h-28 px-3 py-2 border border-input rounded-md text-sm resize-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="No. of people"
                value={booking.number_of_people}
                onChange={e => setBooking(b => ({ ...b, number_of_people: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Your budget (₦)"
                value={booking.budget}
                onChange={e => setBooking(b => ({ ...b, budget: e.target.value }))}
              />
            </div>
            <Input placeholder="Any dietary notes? (optional)" value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={bookMutation.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {bookMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}