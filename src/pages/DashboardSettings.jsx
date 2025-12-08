import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Store, Upload, MapPin, Clock, Phone, Mail, 
  Loader2, Save, Eye, EyeOff, Trash2, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
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
import { createPageUrl } from '../utils';

const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];
const cuisineTypes = ['Nigerian', 'Swallow', 'Rice Dishes', 'Grills', 'Snacks', 'Drinks', 'Continental', 'Fast Food'];

export default function DashboardSettings() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        setFormData(restaurants[0]);
      } else {
        window.location.href = createPageUrl('RestaurantSetup');
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'cover_image_url']: file_url
      }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const toggleCuisine = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      cuisine_types: (prev.cuisine_types || []).includes(cuisine)
        ? prev.cuisine_types.filter(c => c !== cuisine)
        : [...(prev.cuisine_types || []), cuisine]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Restaurant.update(restaurant.id, formData);
      setRestaurant(formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOpen = async () => {
    const newStatus = !formData.is_open;
    setFormData(prev => ({ ...prev, is_open: newStatus }));
    try {
      await base44.entities.Restaurant.update(restaurant.id, { is_open: newStatus });
      toast.success(newStatus ? 'Restaurant is now open' : 'Restaurant is now closed');
    } catch (error) {
      setFormData(prev => ({ ...prev, is_open: !newStatus }));
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!restaurant || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your restaurant profile</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* Restaurant Status */}
        <Card className="border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  formData.is_open ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {formData.is_open ? (
                    <Eye className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Restaurant Status</h3>
                  <p className="text-sm text-gray-500">
                    {formData.is_open ? 'Your restaurant is accepting orders' : 'Your restaurant is currently closed'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={formData.is_open}
                onCheckedChange={handleToggleOpen}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors overflow-hidden"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    ) : formData.logo_url ? (
                      <img src={formData.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Upload Logo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors overflow-hidden"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    ) : formData.cover_image_url ? (
                      <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Upload Cover</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Cuisine Types</Label>
              <div className="flex flex-wrap gap-2">
                {cuisineTypes.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      (formData.cuisine_types || []).includes(cuisine)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Location & Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Fee (₦)</Label>
                <Input
                  type="number"
                  value={formData.delivery_fee || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Order (₦)</Label>
                <Input
                  type="number"
                  value={formData.min_order || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Time</Label>
              <Select 
                value={formData.delivery_time} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-30 mins">15-30 mins</SelectItem>
                  <SelectItem value="30-45 mins">30-45 mins</SelectItem>
                  <SelectItem value="45-60 mins">45-60 mins</SelectItem>
                  <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Hours */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Contact & Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={formData.opening_time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={formData.closing_time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Delete Restaurant</p>
                <p className="text-sm text-gray-500">Permanently delete your restaurant and all data</p>
              </div>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            <Separator />

            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full border-gray-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your menu items, orders, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                try {
                  await base44.entities.Restaurant.delete(restaurant.id);
                  toast.success('Restaurant deleted');
                  window.location.href = createPageUrl('Home');
                } catch (error) {
                  toast.error('Failed to delete restaurant');
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}