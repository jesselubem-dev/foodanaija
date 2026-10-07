import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, ChefHat, MapPin, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader, EmptyState } from '../components/fooda/ui';

export default function Chefs() {
  const [search, setSearch] = useState('');

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ['approved-chefs'],
    queryFn: () => base44.entities.Chef.filter({ is_approved: true, is_available: true }),
    staleTime: 5 * 60 * 1000,
  });

  const term = search.trim().toLowerCase();
  const filtered = chefs.filter(c => !term ||
    (c.full_name || '').toLowerCase().includes(term) ||
    c.city?.toLowerCase().includes(term) ||
    c.cuisine_types?.some(x => x.toLowerCase().includes(term))
  );

  return (
    <div className="min-h-screen bg-white pb-10">
      <PageHeader title="Personal chefs" backTo="CustomerHome" />

      <div className="max-w-lg mx-auto px-4">
        <p className="text-[13px] text-gray-500 text-center -mt-1 mb-4">Describe your meal and a chef cooks it for you</p>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 pointer-events-none" />
          <Input
            placeholder="Search by name, city or cuisine"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-[14px] border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-[150px] bg-gray-100" />
                <div className="p-3.5 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/2" /><div className="h-3 bg-gray-100 rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title={term ? 'No chefs match your search' : 'No chefs available yet'}
            message={term ? 'Try a different name, city or cuisine.' : 'Check back soon — new chefs are joining.'}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map(chef => (
              <Link key={chef.id} to={createPageUrl(`ChefDetail?id=${chef.id}`)} className="block">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] press-card">
                  <div className="relative h-[150px] f-tint-gold">
                    {chef.profile_image_url
                      ? <img src={chef.profile_image_url} alt={chef.full_name} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-14 h-14 f-text-gold" /></div>}
                    <span className="absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm f-float">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 mr-1 align-middle" />Available
                    </span>
                  </div>

                  <div className="px-3.5 py-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-[17px] leading-tight truncate">{chef.full_name}</h3>
                        {chef.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-gray-700 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 fill-[#F5B700] text-[#F5B700]" /> {chef.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500 mt-1 truncate">
                        {chef.cuisine_types?.slice(0, 3).join(' · ') || 'Home-style cooking'}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-[12px] text-gray-700">
                        {chef.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{chef.city}</span>}
                        {chef.price_range && <span>{chef.price_range}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
