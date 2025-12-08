import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function DashboardSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    cover_image_url: '',
    address: '',
    city: 'Lagos',
    phone: '',
    email: '',
    opening_time: '08:00',
    closing_time: '22:00',
    is_open: true,
    delivery_fee: 500,
    min_order: 1000,
    delivery_time: '30-45 mins'
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length === 0) {
        navigate(createPageUrl('RestaurantSetup'));
        return;
      }
      
      const rest = restaurants[0];
      setRestaurant(rest);
      setFormData({
        name: rest.name || '',
        description: rest.description || '',
        logo_url: rest.logo_url || '',
        cover_image_url: rest.cover_image_url || '',
        address: rest.address || '',
        city: rest.city || 'Lagos',
        phone: rest.phone || '',
        email: rest.email || '',
        opening_time: rest.opening_time || '08:00',
        closing_time: rest.closing_time || '22:00',
        is_open: rest.is_open !== false,
        delivery_fee: rest.delivery_fee || 500,
        min_order: rest.min_order || 1000,
        delivery_time: rest.delivery_time || '30-45 mins'
      });
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Restaurant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      toast.success('Settings updated successfully');
    }
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = type === 'logo';
    isLogo ? setUploadingLogo(true) : setUploadingCover(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        [isLogo ? 'logo_url' : 'cover_image_url']: file_url
      });
      toast.success(`${isLogo ? 'Logo' : 'Cover image'} uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      isLogo ? setUploadingLogo(false) : setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateRestaurantMutation.mutateAsync({
        id: restaurant.id,
        data: formData
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Settings</h1>
        <p className="text-gray-600">Manage your restaurant information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Restaurant Logo</Label>
                <div className="mt-1">
                  {formData.logo_url ? (
                    <div className="relative">
                      <img src={formData.logo_url} alt="Logo" className="w-full h-32 object-cover rounded-xl" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-sm">Change Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
                      <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Cover Image</Label>
                <div className="mt-1">
                  {formData.cover_image_url ? (
                    <div className="relative">
                      <img src={formData.cover_image_url} alt="Cover" className="w-full h-32 object-cover rounded-xl" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-sm">Change Cover</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'cover')}
                          className="hidden"
                          disabled={uploadingCover}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
                      <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingCover ? 'Uploading...' : 'Upload Cover'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'cover')}
                        className="hidden"
                        disabled={uploadingCover}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Contact</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
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

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Operating Hours</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div>
                <Label>Restaurant Status</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.is_open ? 'Currently accepting orders' : 'Closed - not accepting orders'}
                </p>
              </div>
              <Switch
                checked={formData.is_open}
                onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opening_time">Opening Time</Label>
                <Input
                  id="opening_time"
                  name="opening_time"
                  type="time"
                  value={formData.opening_time}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="closing_time">Closing Time</Label>
                <Input
                  id="closing_time"
                  name="closing_time"
                  type="time"
                  value={formData.closing_time}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-2xl border border-emerald-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="delivery_fee">Delivery Fee (₦)</Label>
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                value={formData.delivery_fee}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="min_order">Min Order (₦)</Label>
              <Input
                id="min_order"
                name="min_order"
                type="number"
                value={formData.min_order}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="delivery_time">Delivery Time</Label>
              <Input
                id="delivery_time"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleInputChange}
                placeholder="e.g., 30-45 mins"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/20"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}