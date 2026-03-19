import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, ChefHat, ArrowLeft, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BottomNav from '../components/customer/BottomNav';

export default function Chefs() {
  const [search, setSearch] = useState('');

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ['approved-chefs'],
    queryFn: () => base44.entities.Chef.filter({ is_approved: true, is_available: true }),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = chefs.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.cuisine_types?.some(x => x.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('CustomerHome')}>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Personal Chefs</h1>
            <p className="text-xs text-gray-500">Describe your meal, a chef cooks it for you!</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, city or cuisine..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-2xl bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ChefHat className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No chefs available yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(chef => (
              <Link key={chef.id} to={createPageUrl(`ChefDetail?id=${chef.id}`)}>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all active:scale-95">
                  {/* Profile Image */}
                  <div className="relative h-44 bg-gradient-to-br from-orange-100 to-amber-100">
                    {chef.profile_image_url
                      ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-16 h-16 text-orange-300" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {chef.is_available && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 text-white text-xs rounded-full font-semibold shadow">
                        ● Available
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold text-base leading-tight">{chef.full_name}</h3>
                      <div className="flex items-center gap-1 mt-0.5 text-white/90">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{chef.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    {chef.cuisine_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {chef.cuisine_types.slice(0, 3).map(c => (
                          <span key={c} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-lg font-medium">{c}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Same day cooking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {chef.price_range && (
                          <span className="text-xs font-bold text-green-700">{chef.price_range}</span>
                        )}
                        {chef.rating > 0 && (
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span className="font-semibold">{chef.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center text-sm font-semibold py-2 rounded-xl">
                      View Profile & Book →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav currentPage="Chefs" />
    </div>
  );
}