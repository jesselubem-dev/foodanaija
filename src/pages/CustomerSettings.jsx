import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, MapPin, Trash2, Edit2, Check, LogOut, UserX, MessageCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';
import NoInternet from '../components/NoInternet';
import BottomNav from '../components/customer/BottomNav';
import ThemeToggle from '../components/customer/ThemeToggle';

function CustomerSettingsContent() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    city: 'Sokoto'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: addresses = [] } = useQuery({
    queryKey: ['saved-addresses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.SavedAddress.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.SavedAddress.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      setShowAddDialog(false);
      setFormData({ label: '', address: '', city: 'Sokoto' });
      toast.success('Address saved successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.SavedAddress.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      setShowAddDialog(false);
      setEditingAddress(null);
      setFormData({ label: '', address: '', city: 'Sokoto' });
      toast.success('Address updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.SavedAddress.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Address deleted');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (addressId) => {
      // First, unset all defaults
      const updatePromises = addresses.map(addr => 
        base44.entities.SavedAddress.update(addr.id, { is_default: false })
      );
      await Promise.all(updatePromises);
      
      // Then set the selected one as default
      return await base44.entities.SavedAddress.update(addressId, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Default address updated');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.label || !formData.address) {
      toast.error('Please fill in all fields');
      return;
    }

    const data = {
      ...formData,
      user_email: user.email,
      is_default: addresses.length === 0 // First address is default
    };

    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city || 'Sokoto'
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('cart');
    sessionStorage.clear();
    base44.auth.logout(createPageUrl('CustomerHome'));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const initial = (user.full_name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-28">
      <NoInternet />

      {/* Soft top header */}
      <header className="bg-white">
        <div className="px-5 pt-5 pb-5 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-lg">
                {initial}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium tracking-wide">WELCOME BACK</p>
                <h1 className="text-[15px] font-bold text-gray-900 leading-tight">{user.full_name || 'Fooda User'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <Link to={createPageUrl('CustomerHome')} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center press-sm relative">
                <Bell className="w-[18px] h-[18px] text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>
              <Link to={createPageUrl('CustomerHome')} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center press-sm">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* Account info */}
        <section className="bg-white rounded-2xl p-5">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Name</span>
              <span className="text-sm font-medium text-gray-900">{user.full_name || '—'}</span>
            </div>
            <div className="h-px bg-gray-50" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 flex-shrink-0">Email</span>
              <span className="text-sm font-medium text-gray-900 truncate">{user.email}</span>
            </div>
          </div>
        </section>

        {/* Saved Addresses */}
        <section className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Saved Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setFormData({ label: '', address: '', city: 'Sokoto' });
                setShowAddDialog(true);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-orange-500 press-sm"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No saved addresses</p>
              <p className="text-xs text-gray-400 mt-1">Add one for faster checkout</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-3.5 rounded-xl border ${
                    address.is_default
                      ? 'border-orange-200 bg-orange-50/40'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-gray-900">{address.label}</h3>
                        {address.is_default && (
                          <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{address.address}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{address.city}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(address)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center press-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center press-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                  {!address.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(address.id)}
                      className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-orange-500 press-sm"
                    >
                      <Check className="w-3 h-3" /> Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Support */}
        <section className="bg-white rounded-2xl overflow-hidden">
          <a
            href="https://wa.me/2347078700001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 press"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Chat on WhatsApp</p>
              <p className="text-[11px] text-gray-400">We're here to help</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
          </a>
        </section>

        {/* Account Actions */}
        <section className="bg-white rounded-2xl overflow-hidden">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 press">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-600" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-gray-900">Logout</span>
            <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
          </button>
          <div className="h-px bg-gray-50 mx-4" />
          <Link to={createPageUrl('DeleteAccount')} className="flex items-center gap-3 p-4 press">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <UserX className="w-4 h-4 text-red-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-red-500">Delete Account</span>
            <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
          </Link>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Are you sure you want to delete this address?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />

      {/* Add/Edit Address Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Label
              </label>
              <Input
                placeholder="e.g., Home, Office, School"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Address
              </label>
              <Input
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                City
              </label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sokoto">Sokoto</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Abuja">Abuja</SelectItem>
                  <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                  <SelectItem value="Ibadan">Ibadan</SelectItem>
                  <SelectItem value="Kano">Kano</SelectItem>
                  <SelectItem value="Enugu">Enugu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingAddress(null);
                  setFormData({ label: '', address: '', city: 'Sokoto' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingAddress ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerSettings() {
  return (
    <LanguageProvider>
      <CustomerSettingsContent />
    </LanguageProvider>
  );
}