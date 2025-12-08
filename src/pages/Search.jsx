import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import FoodCard from '../components/ui/FoodCard';
import CategoryChip from '../components/ui/CategoryChip';

const cities = ['All Cities', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];
const categories = ['All', 'Swallow', 'Rice', 'Soups', 'Grills', 'Snacks', 'Drinks', 'Breakfast', 'Desserts'];

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [showFilters, setShowFilters] = useState(false);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants', 'search'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
  });

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !searchQuery || 
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_types?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || 
      r.cuisine_types?.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    const matchesCity = selectedCity === 'All Cities' || r.city === selectedCity;
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  const activeFiltersCount = [
    selectedCategory !== 'All',
    selectedCity !== 'All Cities'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedCity('All Cities');
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Restaurants</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search restaurants, cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-white border-emerald-100"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 px-4 rounded-xl border-emerald-100 relative">
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center justify-between">
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-emerald-600">
                      Clear All
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* City Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCity === city
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cuisine Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => setShowFilters(false)}
                  className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory !== 'All' || selectedCity !== 'All Cities') && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'All' && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1">
              {selectedCategory}
              <button onClick={() => setSelectedCategory('All')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedCity !== 'All Cities' && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1">
              {selectedCity}
              <button onClick={() => setSelectedCity('All Cities')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Categories Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((category) => (
          <CategoryChip
            key={category}
            category={category}
            isActive={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters} className="border-emerald-200 text-emerald-600">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <FoodCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}