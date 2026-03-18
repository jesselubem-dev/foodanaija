import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ChefHat, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { createPageUrl } from '../utils';

const STEPS = ['Personal Info', 'Specialties', 'Availability'];

export default function ChefSetup() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: 'Lagos',
    bio: '',
    profile_image_url: '',
    cuisine_types: [],
    capacity_examples: [''],
    price_range: '',
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm(f => ({ ...f, full_name: u.full_name || '' }));
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const cuisineOptions = ['Nigerian', 'Continental', 'Chinese', 'Indian', 'Italian', 'Lebanese', 'Intercontinental'];
  const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Sokoto'];

  const toggleCuisine = (c) => {
    setForm(f => ({
      ...f,
      cuisine_types: f.cuisine_types.includes(c)
        ? f.cuisine_types.filter(x => x !== c)
        : [...f.cuisine_types, c]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, profile_image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.Chef.create({
      ...form,
      owner_email: user.email,
      capacity_examples: form.capacity_examples.filter(Boolean),
    });
    toast.success('Chef profile submitted! Awaiting admin approval.');
    setTimeout(() => { window.location.href = createPageUrl('CustomerHome'); }, 1500);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Register as a Chef</h1>
            <p className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-orange-500' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center">
                  {form.profile_image_url
                    ? <img src={form.profile_image_url} alt="" className="w-full h-full object-cover" />
                    : <ChefHat className="w-10 h-10 text-orange-400" />
                  }
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
            </div>
            <Input placeholder="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <select
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full h-9 px-3 border border-input rounded-md text-sm bg-transparent"
            >
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea
              placeholder="Tell customers about yourself and your cooking style..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full h-24 px-3 py-2 border border-input rounded-md text-sm resize-none"
            />
          </div>
        )}

        {/* Step 1: Specialties */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Cuisine Types (select all that apply)</p>
              <div className="flex flex-wrap gap-2">
                {cuisineOptions.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      form.cuisine_types.includes(c)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">What can you cook? (add examples)</p>
              {form.capacity_examples.map((ex, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`e.g. 2 liters of Egusi soup`}
                    value={ex}
                    onChange={e => {
                      const arr = [...form.capacity_examples];
                      arr[i] = e.target.value;
                      setForm(f => ({ ...f, capacity_examples: arr }));
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, capacity_examples: [...f.capacity_examples, ''] }))}
                className="text-sm text-orange-500 font-medium mt-1"
              >
                + Add another
              </button>
            </div>
            <Input
              placeholder="Price range e.g. ₦5,000 - ₦50,000"
              value={form.price_range}
              onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))}
            />
          </div>
        )}

        {/* Step 2: Review & Submit */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-2xl p-4 space-y-2">
              <p className="font-bold text-gray-900">{form.full_name}</p>
              <p className="text-sm text-gray-500">{form.city} • {form.phone}</p>
              {form.bio && <p className="text-sm text-gray-700">{form.bio}</p>}
              {form.cuisine_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.cuisine_types.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{c}</span>
                  ))}
                </div>
              )}
              {form.price_range && <p className="text-sm font-medium text-green-700">{form.price_range}</p>}
            </div>
            <p className="text-sm text-gray-500 text-center">
              Your profile will be reviewed by our team before going live. This usually takes less than 24 hours.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={step === 0 && (!form.full_name || !form.phone)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? 'Submitting...' : 'Submit Profile 🎉'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}