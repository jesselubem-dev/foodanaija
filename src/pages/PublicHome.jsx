import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, Bike } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PublicHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['all-restaurants-public'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const cities = ['Sokoto'];

  const isRestaurantOpen = (restaurant) => {
    if (!restaurant.is_open) return false;
    if (!restaurant.opening_time || !restaurant.closing_time) return restaurant.is_open;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = restaurant.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = restaurant.closing_time.split(':').map(Number);
    const openingTime = openHour * 60 + openMin;
    const closingTime = closeHour * 60 + closeMin;
    if (closingTime < openingTime) return currentTime >= openingTime || currentTime <= closingTime;
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const filteredRestaurants = restaurants
    .filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = selectedCity === 'all' || r.city === selectedCity;
      return matchesSearch && matchesCity;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Top Banner - Login CTA */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png"
            alt="Fooda Naija"
            className="h-8 w-auto object-contain"
          />
          <span className="text-white text-sm font-medium hidden sm:block">Order food from the best restaurants</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl('CustomerHome'))}
            className="bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl shadow hover:bg-orange-50 transition-colors"
          >
            Log In / Sign Up
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl('Home'))}
            className="bg-white/20 text-white border border-white/40 text-xs px-3 py-2 rounded-xl hover:bg-white/30 transition-colors hidden sm:block"
          >
            🍽️ Register Restaurant
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {/* Greeting */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Hi there! 👋</h2>
          <p className="text-sm text-gray-500">What would you like to eat today?</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-2xl border-gray-200 bg-gray-50 text-base"
            />
          </div>
        </div>

        {/* Book a Chef Banner */}
        <button
          onClick={() => base44.auth.redirectToLogin(createPageUrl('CustomerHome'))}
          className="block w-full mb-4"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">👨‍🍳</span>
            </div>
            <div className="flex-1 text-white">
              <p className="font-bold text-base">Book a Personal Chef</p>
              <p className="text-xs text-white/80 mt-0.5">Describe your meal, a chef cooks it for you!</p>
            </div>
            <div className="text-white/80 text-xl">›</div>
          </div>
        </button>

        {/* City Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCity === 'all' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Cities
          </button>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCity === city ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Restaurants */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 font-medium">No restaurants available right now</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => {
              const isOpen = isRestaurantOpen(restaurant);
              return isOpen ? (
                <button
                  key={restaurant.id}
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('CustomerHome'))}
                  className="text-left w-full"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer active:scale-95">
                    <div className="relative">
                      {restaurant.cover_image_url ? (
                        <img src={restaurant.cover_image_url} alt="" className="w-full h-44 object-cover" />
                      ) : (
                        <div className="w-full h-44 bg-gradient-to-br from-orange-100 to-yellow-100" />
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-green-500/90 text-white">
                        ● Open
                      </div>
                    </div>
                    <div className="p-4 pt-8">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-3">{restaurant.description}</p>
                      {restaurant.cuisine_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {restaurant.cuisine_types.slice(0, 2).map((cuisine, idx) => (
                            <span key={idx} className={`px-2 py-1 text-xs rounded-lg font-medium ${idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-blue-500 font-medium">
                          <Bike className="w-4 h-4" />
                          <span>5-15 mins</span>
                        </div>
                        <span className="text-gray-500">₦500</span>
                        {restaurant.rating > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span className="font-bold">{restaurant.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  key={restaurant.id}
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('CustomerHome'))}
                  className="text-left w-full cursor-not-allowed"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 opacity-60">
                    <div className="relative">
                      {restaurant.cover_image_url ? (
                        <img src={restaurant.cover_image_url} alt="" className="w-full h-44 object-cover grayscale" />
                      ) : (
                        <div className="w-full h-44 bg-gradient-to-br from-orange-100 to-yellow-100 grayscale" />
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gray-800/90 text-white">
                        ● Closed
                      </div>
                    </div>
                    <div className="p-4 pt-8">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-3">{restaurant.description}</p>
                      {restaurant.cuisine_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {restaurant.cuisine_types.slice(0, 2).map((cuisine, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Bike className="w-4 h-4" />
                          <span>5-15 mins</span>
                        </div>
                        <span className="text-gray-500">₦500</span>
                        {restaurant.rating > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Star className="w-4 h-4 fill-amber-600" />
                            <span className="font-semibold">{restaurant.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 text-center">
          <p className="text-lg font-bold text-gray-900 mb-1">Ready to order?</p>
          <p className="text-sm text-gray-500 mb-4">Create a free account to place orders and track your delivery.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl('CustomerHome'))}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-orange-500/30 hover:opacity-90 transition-opacity"
          >
            Get Started — It's Free
          </button>
        </div>
      </div>
    </div>
  );
}