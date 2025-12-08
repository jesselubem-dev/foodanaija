import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, ChevronRight, Sparkles, Flame, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import FoodCard from '../components/ui/FoodCard';
import CategoryChip from '../components/ui/CategoryChip';

const categories = ['All', 'Swallow', 'Rice', 'Soups', 'Grills', 'Snacks', 'Drinks'];

const promos = [
  {
    id: 1,
    title: 'First Order Discount',
    subtitle: 'Get 20% off your first order',
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '🎉'
  },
  {
    id: 2,
    title: 'Free Delivery Weekend',
    subtitle: 'On orders above ₦5,000',
    gradient: 'from-amber-500 to-orange-600',
    emoji: '🚀'
  },
  {
    id: 3,
    title: 'Jollof Rice Special',
    subtitle: 'Best Jollof in Lagos',
    gradient: 'from-rose-500 to-pink-600',
    emoji: '🍛'
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPromo, setCurrentPromo] = useState(0);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
  });

  // Auto-rotate promos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.cuisine_types?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || 
                            r.cuisine_types?.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span>Delivering to Lagos, Nigeria</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          What would you like<br />
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            to eat today?
          </span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search for restaurants or food..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl bg-white border-emerald-100 focus:border-emerald-300 shadow-sm"
        />
      </div>

      {/* Promo Carousel */}
      <div className="mb-8 relative overflow-hidden rounded-3xl">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentPromo * 100}%)` }}
        >
          {promos.map((promo) => (
            <div 
              key={promo.id}
              className={`w-full flex-shrink-0 bg-gradient-to-r ${promo.gradient} p-6 md:p-8 rounded-3xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-4xl mb-3 block">{promo.emoji}</span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{promo.title}</h3>
                  <p className="text-white/80 text-sm md:text-base">{promo.subtitle}</p>
                </div>
                <Button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0">
                  Order Now
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Promo Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {promos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPromo(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPromo ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <CategoryChip
              key={category}
              category={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Popular Restaurants */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Popular Near You</h2>
          </div>
          <Link to={createPageUrl('Search')} className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <FoodCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Picks Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Delivery</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Jollof Rice', 'Fried Rice', 'Suya', 'Puff Puff'].map((item) => (
            <Link 
              key={item}
              to={createPageUrl(`Search?q=${encodeURIComponent(item)}`)}
              className="bg-white rounded-2xl p-4 text-center hover:shadow-lg transition-all border border-emerald-50 group"
            >
              <div className="text-3xl mb-2">{
                item === 'Jollof Rice' ? '🍛' :
                item === 'Fried Rice' ? '🍚' :
                item === 'Suya' ? '🍢' : '🥯'
              }</div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                {item}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Partner CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Own a Restaurant?</h3>
            <p className="text-gray-400 text-sm md:text-base">Partner with Foodanaija and grow your business</p>
          </div>
          <Link to={createPageUrl('RestaurantSetup')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}