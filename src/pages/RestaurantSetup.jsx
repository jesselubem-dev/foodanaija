import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Upload, ChefHat, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function RestaurantSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
    delivery_fee: 500,
    min_order: 1000,
    delivery_time: '30-45 mins',
    cuisine_types: []
  });

  const [selectedCuisines, setSelectedCuisines] = useState([]);

  const cuisineOptions = ['Rice', 'Swallow', 'Soups', 'Grills', 'Snacks', 'Drinks', 'Breakfast', 'Desserts'];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if user already has a restaurant
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        toast.info('You already have a restaurant');
        navigate(createPageUrl('DashboardHome'));
      }

      setFormData(prev => ({ ...prev, email: userData.email }));
    } catch (e) {
      toast.error('Please sign in to continue');
      base44.auth.redirectToLogin(window.location.href);
    }
  };

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

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedCuisines.length === 0) {
      toast.error('Please select at least one cuisine type');
      return;
    }

    setLoading(true);

    try {
      await base44.entities.Restaurant.create({
        ...formData,
        cuisine_types: selectedCuisines,
        owner_email: user.email,
        is_approved: false,
        is_open: true
      });

      toast.success('Restaurant registered successfully! Awaiting approval.');
      navigate(createPageUrl('DashboardHome'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to register restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Restaurant</h1>
          <p className="text-gray-600">Join Foodanaija and reach thousands of hungry customers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-emerald-50 p-8 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mama's Kitchen"
                  required
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
                  placeholder="Tell customers about your restaurant..."
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
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, logo_url: '' })}
                          className="absolute top-2 right-2 bg-white"
                        >
                          Change
                        </Button>
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
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                          className="absolute top-2 right-2 bg-white"
                        >
                          Change
                        </Button>
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
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Contact</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                  required
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
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
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08012345678"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Operating Hours</h2>
            
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

          {/* Cuisine Types */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cuisine Types *</h2>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedCuisines.includes(cuisine)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {selectedCuisines.includes(cuisine) && <CheckCircle className="w-4 h-4 inline mr-1" />}
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Settings */}
          <div>
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
            {loading ? 'Registering...' : 'Register Restaurant'}
          </Button>
        </form>
      </div>
    </div>
  );
}