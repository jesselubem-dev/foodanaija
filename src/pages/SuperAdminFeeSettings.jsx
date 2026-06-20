import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Settings, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const DEFAULTS = {
  delivery_fee: 800,
  vas_tier_1_fee: 300,
  vas_tier_2_min: 5000,
  vas_tier_2_fee: 700,
  vas_tier_3_min: 10000,
  vas_tier_3_fee: 1500,
  vas_tier_4_min: 25000,
  vas_tier_4_fee: 3000,
};

export default function SuperAdminFeeSettings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin' && u?._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (settingsList.length > 0) {
      setForm({ ...DEFAULTS, ...settingsList[0] });
    }
  }, [settingsList]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const numericData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, Number(v)])
      );
      if (settingsList.length > 0) {
        return base44.entities.PlatformSettings.update(settingsList[0].id, numericData);
      } else {
        return base44.entities.PlatformSettings.create(numericData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Fee settings saved successfully!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    toast.info('Reset to default values (not saved yet)');
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('SuperAdminDashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Fee Settings
            </h1>
            <p className="text-sm text-gray-500">Configure delivery and service fees platform-wide</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Delivery Fee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Flat delivery fee per restaurant (₦)</label>
              <Input
                type="number"
                min="0"
                value={form.delivery_fee}
                onChange={e => handleChange('delivery_fee', e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-400">Charged once per restaurant in a customer's order</p>
            </div>
          </CardContent>
        </Card>

        {/* Service Fee Tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Fee Tiers</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Service fee is calculated per restaurant based on the food subtotal</p>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Tier 1 */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Tier 1 — Orders below ₦{Number(form.vas_tier_2_min).toLocaleString()}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Service Fee (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_1_fee}
                    onChange={e => handleChange('vas_tier_1_fee', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-4 bg-orange-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-gray-700">Tier 2</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Minimum Order Amount (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_2_min}
                    onChange={e => handleChange('vas_tier_2_min', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Service Fee (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_2_fee}
                    onChange={e => handleChange('vas_tier_2_fee', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-4 bg-orange-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-gray-700">Tier 3</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Minimum Order Amount (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_3_min}
                    onChange={e => handleChange('vas_tier_3_min', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Service Fee (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_3_fee}
                    onChange={e => handleChange('vas_tier_3_fee', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tier 4 */}
            <div className="p-4 bg-orange-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-gray-700">Tier 4</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Minimum Order Amount (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_4_min}
                    onChange={e => handleChange('vas_tier_4_min', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Service Fee (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.vas_tier_4_fee}
                    onChange={e => handleChange('vas_tier_4_fee', e.target.value)}
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base text-green-700">Current Fee Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Delivery fee per restaurant</span>
                <span className="font-bold">₦{Number(form.delivery_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Service fee (under ₦{Number(form.vas_tier_2_min).toLocaleString()})</span>
                <span className="font-bold">₦{Number(form.vas_tier_1_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Service fee (₦{Number(form.vas_tier_2_min).toLocaleString()} – ₦{Number(form.vas_tier_3_min).toLocaleString()})</span>
                <span className="font-bold">₦{Number(form.vas_tier_2_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Service fee (₦{Number(form.vas_tier_3_min).toLocaleString()} – ₦{Number(form.vas_tier_4_min).toLocaleString()})</span>
                <span className="font-bold">₦{Number(form.vas_tier_3_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Service fee (above ₦{Number(form.vas_tier_4_min).toLocaleString()})</span>
                <span className="font-bold">₦{Number(form.vas_tier_4_fee).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base gap-2"
        >
          <Save className="w-5 h-5" />
          {saveMutation.isPending ? 'Saving...' : 'Save Fee Settings'}
        </Button>
      </div>
    </div>
  );
}