import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import FoodCard from '../components/ui/FoodCard';
import CategoryChip from '../components/ui/CategoryChip';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Rice', 'Swallow', 'Soups', 'Grills', 'Snacks', 'Drinks'];

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: async () => {
      return await base44.entities.Restaurant.filter({ is_approved: true }, '-created_date');
    }
  });

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchTerm === '' || 
      restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || 
      restaurant.cuisine_types?.includes(selectedCategory);
    
    const matchesCity = selectedCity === 'All' || restaurant.city === selectedCity;
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Restaurants</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for restaurants, cuisines, or dishes..."
          className="pl-12 h-14 rounded-2xl border-emerald-100 focus:ring-emerald-500"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* City Filter */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter by City</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'].map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-3">Filter by Category</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
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
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${filteredRestaurants.length} restaurant${filteredRestaurants.length !== 1 ? 's' : ''} found`}
        </p>
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
            <SearchIcon className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredRestaurants.map(restaurant => (
            <FoodCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}