import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, ChefHat, Clock, Check, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, EmptyState, Spinner, BottomActionBar } from '../components/fooda/ui';
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
      let user;
      try {
        user = await base44.auth.me();
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
        throw new Error('Login required');
      }
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
    onError: (e) => { if (e.message !== 'Login required') toast.error('Failed to send booking. Please try again.'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!booking.delivery_address || !booking.booking_date || !booking.meal_description) {
      toast.error('Please fill in address, date, and meal description');
      return;
    }
    bookMutation.mutate(booking);
  };

  const today = new Date().toISOString().slice(0, 10);
  const set = (key) => (e) => setBooking(b => ({ ...b, [key]: e.target.value }));
  const fieldClass = "h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold";
  const labelClass = "block text-[13px] font-medium text-gray-900 mb-1.5";

  if (isLoading) return <Spinner fullScreen />;

  if (!chef) return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Chef" backTo="Chefs" />
      <EmptyState icon={ChefHat} title="Chef not found" message="This chef may no longer be available." actionLabel="Browse chefs" actionTo="Chefs" />
    </div>
  );

  if (bookingSuccess) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-fooda-gold flex items-center justify-center mb-5">
        <Check className="w-10 h-10 f-on-gold" strokeWidth={3} />
      </div>
      <h2 className="text-[22px] font-semibold text-gray-900 mb-1">Booking sent!</h2>
      <p className="text-gray-500 text-sm mb-1">Your request has gone to <span className="font-semibold text-gray-900">{chef.full_name}</span>.</p>
      <p className="text-gray-500 text-sm mb-8">They'll review it and contact you shortly.</p>
      <Link to={createPageUrl('Chefs')} className="h-12 px-8 rounded-2xl flex items-center text-[14px] font-semibold uppercase tracking-wide f-btn-gold press">
        Browse more chefs
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-lg mx-auto px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
          <div className="relative h-[200px] f-tint-gold">
            {chef.profile_image_url
              ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-20 h-20 f-text-gold" /></div>}
            <Link
              to={createPageUrl('Chefs')}
              aria-label="Back"
              className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm f-float press"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[22px] font-medium text-gray-900 leading-tight">{chef.full_name}</h1>
              {chef.rating > 0 && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full f-tint-gold text-gray-900">
                  <Star className="w-3.5 h-3.5 fill-[#F5B700] text-[#F5B700]" /> {chef.rating} ({chef.total_reviews || 0})
                </span>
              )}
            </div>
            {chef.cuisine_types?.length > 0 && (
              <p className="text-[12px] font-semibold text-gray-700 mt-0.5">{chef.cuisine_types.join(' · ')}</p>
            )}
            <div className="flex items-center justify-between mt-3 text-[12px] font-medium text-gray-800">
              {chef.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{chef.city}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Same day cooking</span>
              {chef.price_range && <span>{chef.price_range}</span>}
            </div>
          </div>
        </div>

        {/* About */}
        {chef.bio && (
          <section className="mt-5">
            <h2 className="text-[15px] font-medium text-gray-900 mb-2">About</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed">{chef.bio}</p>
          </section>
        )}

        {/* What they can cook */}
        {chef.capacity_examples?.length > 0 && (
          <section className="mt-5">
            <h2 className="text-[15px] font-medium text-gray-900 mb-2">What {chef.full_name.split(' ')[0]} can cook</h2>
            <div className="space-y-2">
              {chef.capacity_examples.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3.5 py-3">
                  <div className="w-8 h-8 rounded-lg f-tint-gold flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-4 h-4 f-text-amber" />
                  </div>
                  <span className="text-[14px] text-gray-800">{ex}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking form */}
        {showForm && (
          <form id="chef-booking" onSubmit={handleSubmit} className="mt-6 space-y-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Booking details</h2>
            <div>
              <label htmlFor="cb-name" className={labelClass}>Your name</label>
              <Input id="cb-name" autoComplete="name" value={booking.customer_name} onChange={set('customer_name')} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="cb-phone" className={labelClass}>Phone number</label>
              <Input id="cb-phone" type="tel" inputMode="numeric" autoComplete="tel" value={booking.customer_phone} onChange={set('customer_phone')} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="cb-address" className={labelClass}>Cooking / delivery address</label>
              <Input id="cb-address" required autoComplete="street-address" value={booking.delivery_address} onChange={set('delivery_address')} className={fieldClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cb-date" className={labelClass}>Date</label>
                <Input id="cb-date" type="date" min={today} required value={booking.booking_date} onChange={set('booking_date')} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="cb-time" className={labelClass}>Time</label>
                <Input id="cb-time" type="time" value={booking.booking_time} onChange={set('booking_time')} className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="cb-meal" className={labelClass}>What do you want cooked?</label>
              <Textarea
                id="cb-meal"
                required
                placeholder="e.g. Egusi soup with assorted meat, jollof rice for 8 people and puff puff"
                value={booking.meal_description}
                onChange={set('meal_description')}
                className="min-h-[110px] rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cb-people" className={labelClass}>Number of people</label>
                <Input id="cb-people" type="number" min="1" inputMode="numeric" placeholder="e.g. 10" value={booking.number_of_people} onChange={set('number_of_people')} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="cb-budget" className={labelClass}>Budget (₦)</label>
                <Input id="cb-budget" type="number" min="0" inputMode="numeric" placeholder="e.g. 20000" value={booking.budget} onChange={set('budget')} className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="cb-notes" className={labelClass}>Dietary notes</label>
              <Input id="cb-notes" placeholder="Optional" value={booking.notes} onChange={set('notes')} className={fieldClass} />
            </div>
          </form>
        )}
      </div>

      {/* Bottom action */}
      <BottomActionBar>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full h-14 rounded-2xl text-[14px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1 f-btn-gold press"
          >
            Book this chef <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setShowForm(false)} className="h-14 px-5 rounded-2xl text-[14px] font-semibold f-btn-outline press">
              Cancel
            </button>
            <button
              type="submit"
              form="chef-booking"
              disabled={bookMutation.isPending}
              className="flex-1 h-14 rounded-2xl text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
            >
              {bookMutation.isPending ? 'Sending...' : 'Send request'}
            </button>
          </div>
        )}
      </BottomActionBar>
    </div>
  );
}
