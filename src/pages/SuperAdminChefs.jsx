import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, ChefHat, MapPin, Star, CheckCircle, XCircle, 
  Eye, EyeOff, Trash2, Search, Plus, X, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Sokoto'];
const CUISINE_OPTIONS = ['Nigerian', 'Continental', 'Chinese', 'Indian', 'Italian', 'Lebanese', 'Hausa', 'Igbo', 'Yoruba', 'Small Chops', 'BBQ & Grills', 'Suya & Grills', 'Soups & Swallows'];

const EMPTY_FORM = {
  full_name: '', phone: '', city: 'Lagos', bio: '', profile_image_url: '',
  cuisine_types: [], capacity_examples: [''], price_range: '',
  owner_email: '', is_approved: true, is_available: true,
};

export default function SuperAdminChefs() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingChef, setEditingChef] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ['all-chefs'],
    queryFn: () => base44.entities.Chef.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, capacity_examples: data.capacity_examples.filter(Boolean) };
      if (editingChef) return base44.entities.Chef.update(editingChef.id, payload);
      return base44.entities.Chef.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-chefs'] });
      toast.success(editingChef ? 'Chef updated!' : 'Chef added!');
      closeForm();
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, is_approved }) => base44.entities.Chef.update(id, { is_approved }),
    onSuccess: (_, { is_approved }) => {
      queryClient.invalidateQueries({ queryKey: ['all-chefs'] });
      toast.success(is_approved ? 'Chef approved and is now live!' : 'Chef removed from app');
    },
  });

  const toggleAvailableMutation = useMutation({
    mutationFn: ({ id, is_available }) => base44.entities.Chef.update(id, { is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-chefs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Chef.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-chefs'] });
      toast.success('Chef deleted');
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, profile_image_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const toggleCuisine = (c) => {
    setForm(f => ({
      ...f,
      cuisine_types: f.cuisine_types.includes(c)
        ? f.cuisine_types.filter(x => x !== c)
        : [...f.cuisine_types, c]
    }));
  };

  const openEdit = (chef) => {
    setEditingChef(chef);
    setForm({
      full_name: chef.full_name || '',
      phone: chef.phone || '',
      city: chef.city || 'Lagos',
      bio: chef.bio || '',
      profile_image_url: chef.profile_image_url || '',
      cuisine_types: chef.cuisine_types || [],
      capacity_examples: chef.capacity_examples?.length ? chef.capacity_examples : [''],
      price_range: chef.price_range || '',
      owner_email: chef.owner_email || '',
      is_approved: chef.is_approved ?? true,
      is_available: chef.is_available ?? true,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingChef(null);
    setForm(EMPTY_FORM);
  };

  const filtered = chefs.filter(c => {
    const matchSearch = 
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_email?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return matchSearch && !c.is_approved;
    if (filter === 'approved') return matchSearch && c.is_approved;
    return matchSearch;
  });

  const pendingCount = chefs.filter(c => !c.is_approved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage Chefs</h1>
            <p className="text-sm text-gray-500">Screen, approve and manage personal chef profiles</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 border border-amber-200 rounded-xl px-3 py-1.5 text-sm font-medium">
                {pendingCount} pending review
              </span>
            )}
            <Button onClick={() => { setEditingChef(null); setForm(EMPTY_FORM); setShowForm(true); }}
              className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-1" /> Add Chef
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 border-orange-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingChef ? `Edit: ${editingChef.full_name}` : 'Add New Chef'}
                </h2>
                <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-orange-100 flex-shrink-0">
                      {form.profile_image_url
                        ? <img src={form.profile_image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-8 h-8 text-orange-300" /></div>
                      }
                      <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                      <p className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Hover to change'}</p>
                    </div>
                  </div>

                  <Input placeholder="Full Name *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                  <Input placeholder="Phone Number *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input placeholder="Owner Email" value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} />
                  
                  <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full h-9 px-3 border border-input rounded-md text-sm bg-transparent">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <Input placeholder="Price Range e.g. ₦5,000 - ₦50,000" value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} />

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_approved} onChange={e => setForm(f => ({ ...f, is_approved: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                      <span className="text-sm font-medium text-gray-700">Approved (visible on app)</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Available for bookings</span>
                    </label>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <textarea placeholder="Bio / About the chef..." value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full h-24 px-3 py-2 border border-input rounded-md text-sm resize-none" />

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Cuisine Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CUISINE_OPTIONS.map(c => (
                        <button key={c} type="button" onClick={() => toggleCuisine(c)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.cuisine_types.includes(c) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Meals & Capacity Examples</p>
                    {form.capacity_examples.map((ex, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input placeholder={`e.g. Jollof rice for 10 people - ₦15,000`} value={ex}
                          onChange={e => {
                            const arr = [...form.capacity_examples];
                            arr[i] = e.target.value;
                            setForm(f => ({ ...f, capacity_examples: arr }));
                          }} />
                        {form.capacity_examples.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, capacity_examples: f.capacity_examples.filter((_, idx) => idx !== i) }))}
                            className="p-2 text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setForm(f => ({ ...f, capacity_examples: [...f.capacity_examples, ''] }))}
                      className="text-sm text-orange-500 font-medium hover:underline">
                      + Add example
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={closeForm} className="flex-1">Cancel</Button>
                <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.full_name || !form.phone}
                  className="flex-1 bg-orange-500 hover:bg-orange-600">
                  {saveMutation.isPending ? 'Saving...' : editingChef ? 'Update Chef' : 'Add Chef'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search chefs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Chefs List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No chefs found</p>
            {filter === 'pending' && <p className="text-sm text-gray-400 mt-1">No chefs awaiting approval</p>}
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(chef => (
              <Card key={chef.id} className={`transition-shadow hover:shadow-md ${!chef.is_approved ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-orange-100 flex-shrink-0">
                      {chef.profile_image_url
                        ? <img src={chef.profile_image_url} alt={chef.full_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-7 h-7 text-orange-400" /></div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{chef.full_name}</h3>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{chef.city}</span>
                            {chef.owner_email && <span className="text-xs text-gray-400">{chef.owner_email}</span>}
                            {chef.phone && <span className="text-xs text-gray-400">{chef.phone}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={chef.is_approved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                            {chef.is_approved ? '✓ Live on App' : '⏳ Pending Approval'}
                          </Badge>
                          <Badge className={chef.is_available ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}>
                            {chef.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          {chef.rating > 0 && (
                            <Badge className="bg-amber-50 text-amber-700">
                              <Star className="w-3 h-3 fill-amber-500 mr-0.5" />{chef.rating} ({chef.total_reviews})
                            </Badge>
                          )}
                        </div>
                      </div>

                      {chef.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-1">{chef.bio}</p>}

                      {chef.cuisine_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {chef.cuisine_types.map(c => (
                            <span key={c} className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-lg">{c}</span>
                          ))}
                        </div>
                      )}

                      {chef.price_range && <p className="text-sm font-semibold text-green-700 mt-1">{chef.price_range}</p>}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {!chef.is_approved ? (
                          <Button size="sm" onClick={() => approveMutation.mutate({ id: chef.id, is_approved: true })}
                            disabled={approveMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 text-xs h-8">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Go Live
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: chef.id, is_approved: false })}
                            disabled={approveMutation.isPending}
                            className="text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Remove from App
                          </Button>
                        )}

                        <Button size="sm" variant="outline" onClick={() => toggleAvailableMutation.mutate({ id: chef.id, is_available: !chef.is_available })}
                          disabled={toggleAvailableMutation.isPending}
                          className="text-xs h-8">
                          {chef.is_available ? <><EyeOff className="w-3.5 h-3.5 mr-1" />Set Unavailable</> : <><Eye className="w-3.5 h-3.5 mr-1" />Set Available</>}
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => openEdit(chef)}
                          className="text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50">
                          Edit
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => {
                          if (confirm(`Delete ${chef.full_name}? This cannot be undone.`)) deleteMutation.mutate(chef.id);
                        }}
                          className="text-xs h-8 border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}