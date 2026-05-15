import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Copy, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function SuperAdminPromoCode() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: 0,
    is_free_delivery: false,
    max_usage: 0,
    min_order_amount: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
    description: '',
    is_personalised: false,
    assigned_user_email: ''
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => base44.entities.PromoCode.list(),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PromoCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code created');
      resetForm();
    },
    onError: () => toast.error('Failed to create promo code'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PromoCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code updated');
      resetForm();
    },
    onError: () => toast.error('Failed to update promo code'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code deleted');
    },
    onError: () => toast.error('Failed to delete promo code'),
  });

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    if (formData.is_personalised && !formData.assigned_user_email.trim()) {
      toast.error('Please enter the user email for a personalised code');
      return;
    }

    const submitData = {
      ...formData,
      discount_value: parseInt(formData.discount_value) || 0,
      max_usage: parseInt(formData.max_usage) || 0,
      min_order_amount: parseInt(formData.min_order_amount) || 0,
      assigned_user_email: formData.is_personalised ? formData.assigned_user_email.toLowerCase().trim() : '',
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'fixed',
      discount_value: 0,
      is_free_delivery: false,
      max_usage: 0,
      min_order_amount: 0,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      description: '',
      is_personalised: false,
      assigned_user_email: ''
    });
    setEditingCode(null);
    setDialogOpen(false);
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value || 0,
      is_free_delivery: code.is_free_delivery || false,
      max_usage: code.max_usage || 0,
      min_order_amount: code.min_order_amount || 0,
      valid_from: code.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
      valid_until: code.valid_until?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: code.is_active,
      description: code.description || '',
      is_personalised: code.is_personalised || false,
      assigned_user_email: code.assigned_user_email || ''
    });
    setDialogOpen(true);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const isCodeExpired = (code) => {
    return code.valid_until && new Date(code.valid_until) < new Date();
  };

  const isCodeLimitReached = (code) => {
    return code.max_usage > 0 && code.current_usage >= code.max_usage;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-gray-500 mt-1">Manage discount and promotional codes</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Codes</p>
                  <p className="text-3xl font-bold text-gray-900">{promoCodes.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Codes</p>
                  <p className="text-3xl font-bold text-green-600">{promoCodes.filter(c => c.is_active && !isCodeExpired(c)).length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Expired/Inactive</p>
                  <p className="text-3xl font-bold text-amber-600">{promoCodes.filter(c => !c.is_active || isCodeExpired(c)).length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promo Codes List */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle>Promo Codes List</CardTitle>
          </CardHeader>
          <CardContent>
            {promoCodes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No promo codes yet</p>
            ) : (
              <div className="space-y-3">
                {promoCodes.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-200 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{code.code}</code>
                        <button onClick={() => handleCopyCode(code.code)} className="p-2 hover:bg-gray-200 rounded-lg transition">
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                        <Badge className={code.is_active && !isCodeExpired(code) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {code.is_active && !isCodeExpired(code) ? 'Active' : 'Inactive'}
                        </Badge>
                        {code.is_personalised && (
                          <Badge className="bg-purple-100 text-purple-700">Personalised</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Discount</p>
                          <p className="font-semibold text-gray-900">
                            {code.discount_type === 'free_delivery' || code.is_free_delivery ? 'Free Delivery' : 
                             code.discount_type === 'percentage' ? `${code.discount_value}%` : 
                             `₦${code.discount_value}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Usage</p>
                          <p className="font-semibold text-gray-900">{code.current_usage || 0}{code.max_usage > 0 ? `/${code.max_usage}` : '/∞'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Min Order</p>
                          <p className="font-semibold text-gray-900">₦{code.min_order_amount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Expires</p>
                          <p className="font-semibold text-gray-900 text-xs">{code.valid_until ? new Date(code.valid_until).toLocaleDateString() : 'Never'}</p>
                        </div>
                      </div>

                      {code.is_personalised && code.assigned_user_email && (
                        <p className="text-xs text-purple-600 mt-2 font-medium">👤 Assigned to: {code.assigned_user_email}</p>
                      )}
                      {code.description && (
                        <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(code)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(code.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Promo Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE50"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Discount Type</label>
              <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.discount_type !== 'free_delivery' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Discount Value</label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Maximum Uses (0 = Unlimited)</label>
              <Input
                type="number"
                value={formData.max_usage}
                onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                placeholder="e.g., 100"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Minimum Order Amount (₦)</label>
              <Input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                placeholder="e.g., 5000"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Valid From</label>
              <Input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Valid Until</label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Summer sale discount"
                className="mt-1"
              />
            </div>

            {/* Personalised toggle */}
            <div className="border border-orange-100 rounded-xl p-4 bg-orange-50 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_personalised"
                  checked={formData.is_personalised}
                  onChange={(e) => setFormData({ ...formData, is_personalised: e.target.checked, assigned_user_email: '' })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="is_personalised" className="text-sm font-semibold text-orange-700">Personalised Code (Single User Only)</label>
              </div>
              {formData.is_personalised && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Assign to User Email</label>
                  <Input
                    type="email"
                    value={formData.assigned_user_email}
                    onChange={(e) => setFormData({ ...formData, assigned_user_email: e.target.value.toLowerCase() })}
                    placeholder="e.g., customer@gmail.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only this user will be able to use this code</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {editingCode ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}