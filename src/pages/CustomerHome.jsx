import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, MapPin, Star, Clock, Bike, ChefHat, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted) {
      window.location.href = createPageUrl('Onboarding');
      return;
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const { data: restaurants = [], isLoading, error } = useQuery({
    queryKey: ['approved-restaurants'],
    queryFn: async () => {
      const results = await base44.entities.Restaurant.filter({ is_approved: true });
      return results;
    },
  });

  if (error) {
    console.error('Error loading restaurants:', error);
  }

  const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.cuisine_types?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || r.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Foodanaija</h1>
                <p className="text-xs text-gray-500">Order your favorite meals</p>
              </div>
            </div>
            
            <Link to={createPageUrl('Cart')}>
              <Button className="relative bg-gradient-to-r from-emerald-500 to-emerald-600">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Order Food from Your <span className="gradient-text">Favorite Restaurants</span>
          </h2>
          <p className="text-lg text-gray-600">
            Fresh meals delivered to your doorstep
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search restaurants or cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="md:w-48 h-12">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Restaurants Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No restaurants found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}>
                <Card className="border-emerald-100 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                  {restaurant.cover_image_url ? (
                    <img 
                      src={restaurant.cover_image_url} 
                      alt="" 
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-t-xl flex items-center justify-center">
                      <ChefHat className="w-16 h-16 text-emerald-600" />
                    </div>
                  )}
                  
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {restaurant.logo_url && (
                        <img 
                          src={restaurant.logo_url} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{restaurant.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {restaurant.cuisine_types?.slice(0, 3).map((cuisine, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{restaurant.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>{restaurant.delivery_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-emerald-600" />
                        <span>₦{restaurant.delivery_fee?.toLocaleString()} delivery</span>
                      </div>
                      {restaurant.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>{restaurant.rating} ({restaurant.total_reviews} reviews)</span>
                        </div>
                      )}
                    </div>

                    {!restaurant.is_open && (
                      <Badge className="mt-3 bg-red-100 text-red-700">Currently Closed</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}