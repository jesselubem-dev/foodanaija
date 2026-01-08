import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, ArrowRight, Store, Upload, MapPin, 
  Clock, Phone, Mail, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const steps = [
  { id: 1, title: 'Your Details', icon: Store },
  { id: 2, title: 'Restaurant Info', icon: Store },
  { id: 3, title: 'Hours & Contact', icon: Clock },
];

const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Sokoto'];
const cuisineTypes = ['Nigerian', 'Swallow', 'Rice Dishes', 'Grills', 'Snacks', 'Drinks', 'Continental', 'Fast Food'];

export default function RestaurantSetup() {
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    name: '',
    description: '',
    logo_url: '',
    cover_image_url: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    opening_time: '08:00',
    closing_time: '22:00',
    min_order: 1000,
    delivery_time: '30-45 mins',
    cuisine_types: []
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({ ...prev, email: userData.email }));
      
      // Check if already has restaurant
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      if (restaurants.length > 0) {
        window.location.href = createPageUrl('DashboardHome');
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
      cuisine_types: prev.cuisine_types.includes(cuisine)
        ? prev.cuisine_types.filter(c => c !== cuisine)
        : [...prev.cuisine_types, cuisine]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.owner_name || !formData.name || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const restaurant = await base44.entities.Restaurant.create({
        ...formData,
        owner_email: user.email,
        is_approved: false,
        is_open: true,
        rating: 0,
        total_reviews: 0
      });

      // Create default categories
      const defaultCategories = [
        'Rice Dishes',
        'Swallow & Soup',
        'Local Dishes',
        'Protein & Meat',
        'Stews & Sauces',
        'Fast Food',
        'Snacks & Small Chops',
        'Breakfast',
        'Drinks & Beverages',
        'Desserts',
        'Family Packs / Combo Meals',
        'Healthy Options'
      ];

      await base44.entities.MenuCategory.bulkCreate(
        defaultCategories.map((name, index) => ({
          restaurant_id: restaurant.id,
          name,
          display_order: index,
          is_active: true
        }))
      );
      
      toast.success('Welcome to Foodanaija! Your restaurant has been registered.');
      window.location.href = createPageUrl('DashboardHome');
    } catch (error) {
      toast.error('Failed to register restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.owner_name;
      case 2:
        return formData.name && formData.description;
      case 3:
        return formData.address && formData.city;
      case 4:
        return formData.phone;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Partner with Foodanaija</h1>
        <p className="text-sm text-gray-500">Register your restaurant</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                currentStep >= step.id 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <span className={`text-xs mt-2 ${
                currentStep >= step.id ? 'text-orange-600 font-medium' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-3 rounded-full ${
                currentStep > step.id ? 'bg-orange-500' : 'bg-gray-100'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Let's get to know you!</h2>
              <p className="text-gray-500 text-sm">Tell us about yourself</p>
            </div>

            <div className="space-y-2">
              <Label>Your Full Name *</Label>
              <Input
                placeholder="e.g., John Doe"
                value={formData.owner_name}
                onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Your Phone Number *</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={formData.owner_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="bg-orange-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">
                👋 This information will be used to personalize your dashboard and for communication purposes.
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Tell us about your restaurant</h2>
              <p className="text-gray-500 text-sm">Basic information about your business</p>
            </div>

            <div className="space-y-2">
              <Label>Restaurant Name *</Label>
              <Input
                placeholder="e.g., Mama's Kitchen"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Tell customers about your restaurant..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] rounded-xl"
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
                      formData.cuisine_types.includes(cuisine)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

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
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    ) : formData.logo_url ? (
                      <img src={formData.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Upload Logo</span>
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
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    ) : formData.cover_image_url ? (
                      <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Upload Cover</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Full Address *</Label>
              <Textarea
                placeholder="Street address, landmark..."
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="min-h-[80px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>City *</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min. Order (₦)</Label>
              <Input
                type="number"
                value={formData.min_order}
                onChange={(e) => setFormData(prev => ({ ...prev, min_order: parseInt(e.target.value) || 0 }))}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estimated Delivery Time</Label>
              <Select 
                value={formData.delivery_time} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_time: value }))}
              >
                <SelectTrigger className="h-12 rounded-xl">
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
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="bg-orange-500 hover:bg-orange-600 rounded-xl"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}