import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit2, Trash2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SuperAdminDrinks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'Soft Drink',
    is_available: true,
    display_order: 0
  });
  const queryClient = useQueryClient();

  const { data: drinks = [], isLoading } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => base44.entities.Drink.list('-display_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Drink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drinks'] });
      toast.success('Drink added successfully');
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Drink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drinks'] });
      toast.success('Drink updated successfully');
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Drink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drinks'] });
      toast.success('Drink deleted successfully');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: 'Soft Drink',
      is_available: true,
      display_order: 0
    });
    setEditingDrink(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      display_order: parseInt(formData.display_order)
    };

    if (editingDrink) {
      updateMutation.mutate({ id: editingDrink.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (drink) => {
    setEditingDrink(drink);
    setFormData({
      name: drink.name,
      description: drink.description || '',
      price: drink.price.toString(),
      image_url: drink.image_url,
      category: drink.category,
      is_available: drink.is_available,
      display_order: drink.display_order || 0
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this drink?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('SuperAdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Manage Drinks</h1>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-5 h-5 mr-2" />
              Add Drink
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : drinks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No drinks added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {drinks.map((drink) => (
              <Card key={drink.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <img 
                    src={drink.image_url} 
                    alt={drink.name} 
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{drink.name}</h3>
                      <p className="text-sm text-gray-500">{drink.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      drink.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {drink.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-orange-600 mb-3">₦{drink.price?.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(drink)} className="flex-1">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(drink.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDrink ? 'Edit Drink' : 'Add New Drink'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Drink Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Coca-Cola 50cl"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soft Drink">Soft Drink</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Juice">Juice</SelectItem>
                  <SelectItem value="Energy Drink">Energy Drink</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₦)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-4 h-4"
              />
              <Label>Available for sale</Label>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                {editingDrink ? 'Update' : 'Add'} Drink
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}