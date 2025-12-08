import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  User, MapPin, Phone, Mail, ChevronRight, 
  Plus, Edit2, Trash2, LogOut, Store, Heart,
  Bell, HelpCircle, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', city: '' });
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if user has a restaurant
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses', user?.email],
    queryFn: () => base44.entities.SavedAddress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const handleSaveAddress = async () => {
    if (!newAddress.address) {
      toast.error('Please enter an address');
      return;
    }

    try {
      if (editingAddress) {
        await base44.entities.SavedAddress.update(editingAddress.id, newAddress);
        toast.success('Address updated');
      } else {
        await base44.entities.SavedAddress.create({
          ...newAddress,
          user_email: user.email
        });
        toast.success('Address saved');
      }
      refetchAddresses();
      setShowAddAddress(false);
      setEditingAddress(null);
      setNewAddress({ label: '', address: '', city: '' });
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async () => {
    try {
      await base44.entities.SavedAddress.delete(deleteAddressId);
      toast.success('Address deleted');
      refetchAddresses();
      setDeleteAddressId(null);
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.full_name || 'Welcome!'}</h1>
            <p className="text-emerald-100 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Restaurant Partner Section */}
      {restaurant ? (
        <Link to={createPageUrl('DashboardHome')}>
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-500">Manage your restaurant</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      ) : (
        <Link to={createPageUrl('RestaurantSetup')}>
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 mb-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Partner with Us</h3>
                <p className="text-sm text-gray-400">Start selling on Foodanaija</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      )}

      {/* Saved Addresses */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 mb-6">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Saved Addresses</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAddAddress(true)}
            className="text-emerald-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <Separator />
        <div className="p-4 space-y-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No saved addresses</p>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  {addr.label && (
                    <span className="text-xs font-medium text-emerald-600 uppercase">{addr.label}</span>
                  )}
                  <p className="text-sm text-gray-700">{addr.address}</p>
                  {addr.city && <p className="text-xs text-gray-500">{addr.city}</p>}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingAddress(addr);
                      setNewAddress({ label: addr.label || '', address: addr.address, city: addr.city || '' });
                      setShowAddAddress(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setDeleteAddressId(addr.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 mb-6 overflow-hidden">
        <MenuItem icon={Heart} label="Favorites" />
        <Separator />
        <MenuItem icon={Bell} label="Notifications" />
        <Separator />
        <MenuItem icon={HelpCircle} label="Help & Support" />
        <Separator />
        <MenuItem icon={Settings} label="Settings" />
      </div>

      {/* Logout */}
      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </Button>

      {/* Add/Edit Address Dialog */}
      <Dialog open={showAddAddress} onOpenChange={(open) => {
        setShowAddAddress(open);
        if (!open) {
          setEditingAddress(null);
          setNewAddress({ label: '', address: '', city: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label (Optional)</Label>
              <Input
                placeholder="Home, Work, etc."
                value={newAddress.label}
                onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                placeholder="Full address"
                value={newAddress.address}
                onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="Lagos, Abuja, etc."
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <Button onClick={handleSaveAddress} className="w-full bg-emerald-500 hover:bg-emerald-600">
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-400" />
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  );
}