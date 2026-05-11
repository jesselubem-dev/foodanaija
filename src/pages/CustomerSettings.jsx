import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, MapPin, Trash2, Edit2, Check, LogOut, UserX, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';
import NoInternet from '../components/NoInternet';
import BottomNav from '../components/customer/BottomNav';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/30 pb-24">
      <NoInternet />
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" className="flex items-center gap-1 text-orange-500 font-medium pl-0">
                <ChevronLeft className="w-6 h-6" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Saved Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Addresses</CardTitle>
            <Button 
              onClick={() => {
                setEditingAddress(null);
                setFormData({ label: '', address: '', city: 'Sokoto' });
                setShowAddDialog(true);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No saved addresses yet</p>
                <p className="text-sm text-gray-400">Add your first address to make checkout faster</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div 
                    key={address.id}
                    className={`p-4 rounded-xl border ${
                      address.is_default 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{address.label}</h3>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{address.address}</p>
                        <p className="text-sm text-gray-500 mt-1">{address.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(address.id)}
                        className="text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Set as Default
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('LiveChat')} className="block">
              <Button
                variant="outline"
                className="w-full justify-start text-gray-700 hover:bg-orange-50 hover:border-orange-200"
              >
                <MessageSquare className="w-5 h-5 mr-3 text-orange-500" />
                Chat with Support
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
            <Link to={createPageUrl('DeleteAccount')} className="block">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:bg-red-50 border-red-200"
              >
                <UserX className="w-5 h-5 mr-3" />
                Delete Account
              </Button>
            </Link>
          </CardContent>
        </Card>
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