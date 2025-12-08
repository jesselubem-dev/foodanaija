import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Edit, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function DashboardMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [restaurant, setRestaurant] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0
  });

  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    is_popular: false,
    preparation_time: '15-20 mins'
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
      
      setRestaurant(restaurants[0]);
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menuCategories', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return await base44.entities.MenuCategory.filter({ restaurant_id: restaurant.id }, 'display_order');
    },
    enabled: !!restaurant?.id
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menuItems', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return await base44.entities.MenuItem.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant?.id
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      toast.success('Category created successfully');
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      toast.success('Category updated successfully');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      toast.success('Category deleted');
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setItemDialogOpen(false);
      resetItemForm();
      toast.success('Item created successfully');
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setItemDialogOpen(false);
      resetItemForm();
      toast.success('Item updated successfully');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Item deleted');
    }
  });

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', display_order: 0 });
    setEditingCategory(null);
  };

  const resetItemForm = () => {
    setItemForm({
      category_id: '',
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_available: true,
      is_popular: false,
      preparation_time: '15-20 mins'
    });
    setEditingItem(null);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate({
        ...categoryForm,
        restaurant_id: restaurant.id
      });
    }
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    
    if (!itemForm.category_id) {
      toast.error('Please select a category');
      return;
    }

    const itemData = {
      ...itemForm,
      price: parseFloat(itemForm.price),
      restaurant_id: restaurant.id
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setItemForm({ ...itemForm, image_url: file_url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const openCategoryDialog = (category = null) => {
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order || 0
      });
      setEditingCategory(category);
    } else {
      resetCategoryForm();
    }
    setCategoryDialogOpen(true);
  };

  const openItemDialog = (item = null, categoryId = null) => {
    if (item) {
      setItemForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        image_url: item.image_url || '',
        is_available: item.is_available,
        is_popular: item.is_popular || false,
        preparation_time: item.preparation_time || '15-20 mins'
      });
      setEditingItem(item);
    } else {
      resetItemForm();
      if (categoryId) {
        setItemForm(prev => ({ ...prev, category_id: categoryId }));
      }
    }
    setItemDialogOpen(true);
  };

  const toggleItemAvailability = async (item) => {
    await base44.entities.MenuItem.update(item.id, { is_available: !item.is_available });
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    toast.success(item.is_available ? 'Item marked unavailable' : 'Item marked available');
  };

  if (!restaurant) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant's menu categories and items</p>
        </div>
        <Button onClick={() => openCategoryDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categoriesLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-emerald-50">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-4">Start by creating your first menu category</p>
          <Button onClick={() => openCategoryDialog()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryItems = menuItems.filter(item => item.category_id === category.id);
            
            return (
              <div key={category.id} className="bg-white rounded-2xl border border-emerald-50 overflow-hidden">
                <div className="bg-emerald-50 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openItemDialog(null, category.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openCategoryDialog(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this category? Items in this category will not be deleted.')) {
                          deleteCategoryMutation.mutate(category.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  {categoryItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items in this category yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryItems.map(item => (
                        <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="relative h-32">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {!item.is_available && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge className="bg-red-500">Unavailable</Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleItemAvailability(item)}
                                  className="h-8 w-8"
                                >
                                  {item.is_available ? (
                                    <Eye className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openItemDialog(item)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Delete this item?')) {
                                      deleteItemMutation.mutate(item.id);
                                    }
                                  }}
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-emerald-600">₦{item.price?.toLocaleString()}</p>
                              {item.is_popular && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs">Popular</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Rice Dishes"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="item-category">Category *</Label>
              <select
                id="item-category"
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Jollof Rice"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Describe the dish..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="item-price">Price (₦) *</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Item Image</Label>
              <div className="mt-1">
                {itemForm.image_url ? (
                  <div className="relative">
                    <img src={itemForm.image_url} alt="Item" className="w-full h-48 object-cover rounded-xl" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setItemForm({ ...itemForm, image_url: '' })}
                      className="absolute top-2 right-2 bg-white"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <Label htmlFor="item-available" className="cursor-pointer">Available for sale</Label>
              <Switch
                id="item-available"
                checked={itemForm.is_available}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, is_available: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <Label htmlFor="item-popular" className="cursor-pointer">Mark as popular</Label>
              <Switch
                id="item-popular"
                checked={itemForm.is_popular}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, is_popular: checked })}
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}