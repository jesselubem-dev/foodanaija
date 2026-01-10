import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit2, Trash2, MoreVertical, Loader2, 
  Upload, FolderPlus, ChevronDown, Eye, EyeOff, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function DashboardMenu() {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploading, setUploading] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    category_id: '',
    is_available: true,
    is_popular: false,
    is_promo: false,
    promo_start_date: '',
    promo_end_date: '',
    preparation_time: '15-20 mins'
  });

  const queryClient = useQueryClient();

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
      } else {
        window.location.href = createPageUrl('RestaurantSetup');
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories', restaurant?.id],
    queryFn: () => base44.entities.MenuCategory.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', restaurant?.id],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }),
    enabled: !!restaurant?.id,
  });

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !itemForm.category_id) {
      setItemForm(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories]);

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuCategory.create({
      ...data,
      restaurant_id: restaurant.id,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-categories']);
      toast.success('Category created');
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', description: '' });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-categories']);
      toast.success('Category updated');
      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-categories']);
      toast.success('Category deleted');
      setDeleteCategory(null);
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create({
      ...data,
      restaurant_id: restaurant.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Item added');
      setShowItemDialog(false);
      resetItemForm();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Item updated');
      setShowItemDialog(false);
      setEditingItem(null);
      resetItemForm();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items']);
      toast.success('Item deleted');
      setDeleteItem(null);
    },
  });

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      images: [],
      category_id: categories[0]?.id || '',
      is_available: true,
      is_popular: false,
      is_promo: false,
      promo_start_date: '',
      promo_end_date: '',
      preparation_time: '15-20 mins'
    });
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setItemForm(prev => ({ 
        ...prev, 
        images: [...prev.images, file_url]
      }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setItemForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleSaveItem = () => {
    const data = {
      ...itemForm,
      price: parseFloat(itemForm.price) || 0
    };
    
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your menu categories and items</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '' });
              setShowCategoryDialog(true);
            }}
            className="border-orange-200 text-orange-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button 
            onClick={() => {
              setEditingItem(null);
              setItemForm({
                name: '',
                description: '',
                price: '',
                images: [],
                category_id: categories[0]?.id || '',
                is_available: true,
                is_popular: false,
                is_promo: false,
                promo_start_date: '',
                promo_end_date: '',
                preparation_time: '15-20 mins'
              });
              setShowItemDialog(true);
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
            }`}
          >
            All ({menuItems.length})
          </button>
          {categories.map((category) => {
            const itemCount = menuItems.filter(i => i.category_id === category.id).length;
            return (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {category.name} ({itemCount})
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 rounded-full items-center justify-center hidden group-hover:flex">
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setEditingCategory(category);
                      setCategoryForm({ name: category.name, description: category.description || '' });
                      setShowCategoryDialog(true);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteCategory(category)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Items Grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-orange-50">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items</h3>
          <p className="text-gray-500 text-sm mb-4">Start by adding items to your menu</p>
          <Button onClick={() => setShowItemDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-orange-50 hover:shadow-lg transition-shadow">
              <div className="relative h-36">
                <img 
                  src={item.images?.[0] || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.images?.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    +{item.images.length - 1} more
                  </Badge>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge className="bg-red-500">Unavailable</Badge>
                  </div>
                )}
                {item.is_popular && (
                  <Badge className="absolute top-2 left-2 bg-amber-500">
                    <Flame className="w-3 h-3 mr-1" /> Popular
                  </Badge>
                )}
                {item.is_promo && (
                  <Badge className="absolute top-2 right-2 bg-orange-500">
                    🔥 Promo
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setEditingItem(item);
                      setItemForm({
                        name: item.name,
                        description: item.description || '',
                        price: item.price.toString(),
                        images: item.images || (item.image_url ? [item.image_url] : []),
                        category_id: item.category_id,
                        is_available: item.is_available,
                        is_popular: item.is_popular || false,
                        is_promo: item.is_promo || false,
                        promo_start_date: item.promo_start_date || '',
                        promo_end_date: item.promo_end_date || '',
                        preparation_time: item.preparation_time || '15-20 mins'
                      });
                      setShowItemDialog(true);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      updateItemMutation.mutate({
                        id: item.id,
                        data: { is_available: !item.is_available }
                      });
                    }}>
                      {item.is_available ? (
                        <><EyeOff className="w-4 h-4 mr-2" /> Mark Unavailable</>
                      ) : (
                        <><Eye className="w-4 h-4 mr-2" /> Mark Available</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteItem(item)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                  </div>
                  <span className="font-bold text-orange-600 whitespace-nowrap">
                    ₦{item.price?.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g., Rice Dishes"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleSaveCategory} 
              disabled={!categoryForm.name || createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Images (Add at least 2 images recommended)</Label>
              
              {/* Existing Images */}
              {itemForm.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {itemForm.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Product ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <Badge className="absolute bottom-1 left-1 bg-black/70 text-white text-xs">
                        {idx + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Image */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="item-image"
                  disabled={uploading}
                />
                <label
                  htmlFor="item-image"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl transition-colors ${
                    uploading ? 'cursor-not-allowed' : 'cursor-pointer hover:border-orange-300'
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">
                        {itemForm.images.length === 0 ? 'Upload first image' : `Add image ${itemForm.images.length + 1}`}
                      </span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {itemForm.images.length} image{itemForm.images.length !== 1 ? 's' : ''} uploaded
                {itemForm.images.length < 2 && ' • Add at least 2 images recommended'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={itemForm.category_id} 
                onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {categories.find(c => c.id === itemForm.category_id)?.name || 'Select category'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g., Jollof Rice"
                value={itemForm.name}
                onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the item..."
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Price (₦) *</Label>
              <Input
                type="number"
                placeholder="2500"
                value={itemForm.price}
                onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Available</p>
                <p className="text-sm text-gray-500">Show item on menu</p>
              </div>
              <Switch 
                checked={itemForm.is_available}
                onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_available: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Mark as Popular</p>
                <p className="text-sm text-gray-500">Highlight this item</p>
              </div>
              <Switch 
                checked={itemForm.is_popular}
                onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_popular: checked }))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      Special Promo Deal
                      <Badge className="bg-orange-500 text-white text-xs">HOT</Badge>
                    </p>
                    <p className="text-sm text-gray-600">Showcase this item to all customers</p>
                  </div>
                </div>
                <Switch 
                  checked={itemForm.is_promo}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_promo: checked }))}
                />
              </div>

              {itemForm.is_promo && (
                <div className="grid grid-cols-2 gap-4 pl-6 pt-2 border-l-2 border-orange-200">
                  <div className="space-y-2">
                    <Label>Promo Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={itemForm.promo_start_date ? new Date(itemForm.promo_start_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, promo_start_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Promo End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={itemForm.promo_end_date ? new Date(itemForm.promo_end_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, promo_end_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSaveItem}
              disabled={!itemForm.name || !itemForm.price || !itemForm.category_id || createItemMutation.isPending || updateItemMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {(createItemMutation.isPending || updateItemMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteItemMutation.mutate(deleteItem.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteCategory?.name}" category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also affect items in this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCategoryMutation.mutate(deleteCategory.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}