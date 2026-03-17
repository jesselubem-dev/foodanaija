import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, Search, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SuperAdminMenuMarketing() {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredItems = menuItems.filter(item => {
    const restaurant = restaurants.find(r => r.id === item.restaurant_id);
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      restaurant?.name.toLowerCase().includes(searchLower)
    );
  });

  const copyLink = (item) => {
    const link = `${window.location.origin}/RestaurantDetail?id=${item.restaurant_id}&item=${item.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    toast.success('Link copied! Ready to post on Facebook 🎉');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('SuperAdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Menu Marketing Links</h1>
                <p className="text-sm text-gray-500">Copy & share food item links on Facebook or social media</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by food name or restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No menu items found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const restaurant = restaurants.find(r => r.id === item.restaurant_id);
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-orange-50 flex items-center justify-center">
                        <UtensilsCrossed className="w-10 h-10 text-orange-200" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                    {restaurant && (
                      <Badge variant="outline" className="text-xs mb-2">{restaurant.name}</Badge>
                    )}
                    <p className="text-orange-600 font-bold mb-3">₦{item.price?.toLocaleString()}</p>
                    <Button
                      onClick={() => copyLink(item)}
                      className={`w-full gap-2 ${copiedId === item.id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                      size="sm"
                    >
                      {copiedId === item.id ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy Link</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}