import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronRight, MapPin, TrendingUp } from 'lucide-react';
import FoodCard from '../components/ui/FoodCard';
import CategoryChip from '../components/ui/CategoryChip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Rice', 'Swallow', 'Soups', 'Grills', 'Snacks', 'Drinks'];

const banners = [
  {
    id: 1,
    title: 'Naija Flavors Delivered Fresh',
    subtitle: 'Order from the best restaurants near you',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    bgColor: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 2,
    title: 'Satisfy Your Cravings',
    subtitle: 'Jollof, Suya, Egusi & More',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    bgColor: 'from-amber-500 to-amber-600'
  },
  {
    id: 3,
    title: 'Fast Delivery, Great Taste',
    subtitle: 'Your favorite meals in 30 mins',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    bgColor: 'from-orange-500 to-orange-600'
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Lagos');

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('foodanaija_onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants', selectedCity],
    queryFn: async () => {
      const allRestaurants = await base44.entities.Restaurant.filter({ 
        is_approved: true,
        city: selectedCity 
      }, '-created_date');
      return allRestaurants;
    }
  });

  const filteredRestaurants = selectedCategory === 'All' 
    ? restaurants 
    : restaurants.filter(r => r.cuisine_types?.includes(selectedCategory));

  const completeOnboarding = () => {
    localStorage.setItem('foodanaija_onboarding', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-amber-500 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <span className="text-7xl">🍛</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Welcome to Foodanaija</h1>
            <p className="text-white/90 text-lg">Discover the best Nigerian cuisine, delivered to your doorstep</p>
          </div>

          <div className="space-y-4 mb-8">
            <OnboardingFeature icon="🏪" title="Top Restaurants" desc="Browse verified restaurants across Nigeria" />
            <OnboardingFeature icon="⚡" title="Fast Delivery" desc="Get your food in 30-45 minutes" />
            <OnboardingFeature icon="💳" title="Easy Payments" desc="Pay with card, transfer, or cash" />
          </div>

          <Button 
            onClick={completeOnboarding}
            className="w-full h-14 text-lg bg-white text-emerald-600 hover:bg-white/90 rounded-2xl font-semibold shadow-xl"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Banner Carousel */}
      <div className="relative h-56 mb-6 overflow-hidden">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor}`} />
            <img 
              src={banner.image} 
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
            />
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 max-w-md">
                {banner.title}
              </h2>
              <p className="text-white/90 text-lg max-w-md">{banner.subtitle}</p>
            </div>
          </div>
        ))}
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6">
        {/* City Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">Delivering to</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'].map(city => (
              <Button
                key={city}
                variant={selectedCity === city ? 'default' : 'outline'}
                onClick={() => setSelectedCity(city)}
                className={`rounded-full whitespace-nowrap ${
                  selectedCity === city 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {city}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <CategoryChip
                key={category}
                category={category}
                isActive={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>
        </div>

        {/* Restaurants Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {selectedCategory === 'All' ? 'Popular Restaurants' : selectedCategory}
            </h3>
            <Link to={createPageUrl('Search')}>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                See All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-5xl">🍽️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-500 mb-4">Try selecting a different city or category</p>
              <Button onClick={() => setSelectedCategory('All')} className="bg-emerald-600 hover:bg-emerald-700">
                View All Restaurants
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredRestaurants.map(restaurant => (
                <FoodCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>

        {/* Restaurant Owner CTA */}
        <div className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h3 className="text-2xl font-bold mb-2">Own a Restaurant?</h3>
            <p className="mb-4 text-white/90">Join Foodanaija and reach thousands of hungry customers</p>
            <Link to={createPageUrl('RestaurantSetup')}>
              <Button className="bg-white text-emerald-600 hover:bg-white/90 font-semibold">
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingFeature({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
    </div>
  );
}