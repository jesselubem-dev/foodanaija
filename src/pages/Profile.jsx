import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { User, MapPin, LogOut, Settings, ChefHat, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: ''
  });

  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    address: '',
    city: 'Lagos'
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setProfileData({
        full_name: userData.full_name || '',
        email: userData.email || ''
      });

      // Check if user owns a restaurant
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      }
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['savedAddresses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.SavedAddress.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const addAddressMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedAddress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      setAddressDialogOpen(false);
      setNewAddress({ label: 'Home', address: '', city: 'Lagos' });
      toast.success('Address added successfully');
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedAddress.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      toast.success('Address deleted');
    }
  });

  const handleUpdateProfile = async () => {
    try {
      await base44.auth.updateMe({ full_name: profileData.full_name });
      setUser({ ...user, full_name: profileData.full_name });
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleAddAddress = () => {
    if (!newAddress.address) {
      toast.error('Please enter an address');
      return;
    }
    addAddressMutation.mutate({
      user_email: user.email,
      ...newAddress
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl border border-emerald-50 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.full_name || 'User'}</h2>
            <p className="text-gray-500">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                Admin
              </span>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile} className="bg-emerald-600 hover:bg-emerald-700">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setEditMode(true)} variant="outline" className="border-emerald-200">
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Restaurant Dashboard Link */}
      {restaurant && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{restaurant.name}</h3>
              <p className="text-white/90 text-sm">Restaurant Owner</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl('DashboardHome'))}
            className="bg-white text-emerald-600 hover:bg-white/90 w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      )}

      {/* Saved Addresses */}
      <div className="bg-white rounded-2xl border border-emerald-50 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Saved Addresses
          </h3>
          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="e.g., Home, Office"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    placeholder="Enter full address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <select
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                    <option value="Kano">Kano</option>
                    <option value="Enugu">Enugu</option>
                  </select>
                </div>
                <Button onClick={handleAddAddress} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Add Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {savedAddresses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No saved addresses yet</p>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map(address => (
              <div key={address.id} className="flex items-start justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{address.label}</p>
                  <p className="text-sm text-gray-600">{address.address}</p>
                  <p className="text-xs text-gray-500 mt-1">{address.city}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAddressMutation.mutate(address.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!restaurant && (
          <Button 
            onClick={() => navigate(createPageUrl('RestaurantSetup'))}
            variant="outline"
            className="w-full justify-start border-emerald-200 hover:bg-emerald-50"
          >
            <ChefHat className="w-5 h-5 mr-3 text-emerald-600" />
            Register Your Restaurant
          </Button>
        )}
        
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}