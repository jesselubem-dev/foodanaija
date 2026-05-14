import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Edit2, Tag, UtensilsCrossed, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function SuperAdminAllMenus() {
  const [search, setSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.role === 'admin') setIsAdmin(true);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants-admin'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['all-menu-items-admin'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-menu-items-admin']);
      toast.success('Menu item updated!');
      setEditingItem(null);
    },
  });

  const filteredItems = menuItems.filter(item => {
    const restaurant = restaurants.find(r => r.id === item.restaurant_id);
    const searchLower = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchLower) ||
      restaurant?.name.toLowerCase().includes(searchLower);
    const matchesRestaurant =
      selectedRestaurant === 'all' || item.restaurant_id === selectedRestaurant;
    return matchesSearch && matchesRestaurant;
  });

  const openEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      price: item.price?.toString() || '',
      slashed_price: item.slashed_price?.toString() || '',
      is_available: item.is_available ?? true,
      is_popular: item.is_popular ?? false,
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: editingItem.id,
      data: {
        price: parseFloat(editForm.price) || editingItem.price,
        slashed_price: editForm.slashed_price ? parseFloat(editForm.slashed_price) : null,
        is_available: editForm.is_available,
        is_popular: editForm.is_popular,
      },
    });
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800 mb-2">Access Denied</p>
          <p className="text-gray-500">You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Restaurant Menus</h1>
            <p className="text-sm text-gray-500">Edit prices, slashed prices, and item status</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search food item or restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedRestaurant('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedRestaurant === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              All Restaurants
            </button>
            {restaurants.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRestaurant(r.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedRestaurant === r.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No items found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const restaurant = restaurants.find(r => r.id === item.restaurant_id);
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-36">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-orange-200" />
                      </div>
                    )}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge className="bg-red-500">Unavailable</Badge>
                      </div>
                    )}
                    {item.slashed_price && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 text-white text-xs flex items-center gap-1">
                          <Tag className="w-3 h-3" /> SALE
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-0.5">{item.name}</h3>
                    {restaurant && (
                      <p className="text-xs text-gray-400 mb-2">{restaurant.name}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-orange-600 text-sm">₦{item.price?.toLocaleString()}</span>
                      {item.slashed_price && (
                        <span className="text-gray-400 text-xs line-through">₦{item.slashed_price?.toLocaleString()}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openEdit(item)}
                      className="w-full bg-orange-500 hover:bg-orange-600 gap-1 text-xs"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Price
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit: {editingItem?.name}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-2">
              {/* Price Preview */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Price Preview</p>
                <div className="flex items-center justify-center gap-3">
                  {editForm.slashed_price && (
                    <span className="text-gray-400 line-through text-lg">
                      ₦{parseFloat(editForm.slashed_price || 0).toLocaleString()}
                    </span>
                  )}
                  <span className="text-orange-600 font-black text-2xl">
                    ₦{parseFloat(editForm.price || 0).toLocaleString()}
                  </span>
                  {editForm.slashed_price && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {Math.round((1 - parseFloat(editForm.price) / parseFloat(editForm.slashed_price)) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Actual Price (₦) — what customer pays *</Label>
                <Input
                  type="number"
                  placeholder="800"
                  value={editForm.price}
                  onChange={(e) => setEditForm(p => ({ ...p, price: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-500" />
                  Original Price to Cross Out (₦) — optional
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="e.g. 1000 (will show as ₦1,000 crossed out)"
                    value={editForm.slashed_price}
                    onChange={(e) => setEditForm(p => ({ ...p, slashed_price: e.target.value }))}
                  />
                  {editForm.slashed_price && (
                    <button
                      onClick={() => setEditForm(p => ({ ...p, slashed_price: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">Leave empty to show no crossed-out price</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Available</p>
                  <p className="text-xs text-gray-500">Show on menu</p>
                </div>
                <Switch
                  checked={editForm.is_available}
                  onCheckedChange={(v) => setEditForm(p => ({ ...p, is_available: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Mark as Popular</p>
                </div>
                <Switch
                  checked={editForm.is_popular}
                  onCheckedChange={(v) => setEditForm(p => ({ ...p, is_popular: v }))}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!editForm.price || updateMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}