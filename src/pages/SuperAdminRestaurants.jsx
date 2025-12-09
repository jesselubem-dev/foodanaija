import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, MapPin, Phone, Mail, CheckCircle, XCircle, 
  Eye, Search, Filter, ArrowLeft, ExternalLink, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function SuperAdminRestaurants() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      // Allow access if user is admin OR app creator
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
    enabled: !!user,
  });

  const { data: allMenuItems = [] } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-menu-categories'],
    queryFn: () => base44.entities.MenuCategory.list(),
    enabled: !!user,
  });

  const getRestaurantMenuItems = (restaurantId) => {
    return allMenuItems.filter(item => item.restaurant_id === restaurantId);
  };

  const getRestaurantCategories = (restaurantId) => {
    return allCategories.filter(cat => cat.restaurant_id === restaurantId);
  };

  const approveRestaurantMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.Restaurant.update(id, { is_approved: true }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['all-restaurants']);
      toast.success('Restaurant approved');
      
      // Play bell sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Bell tone
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    },
  });

  const rejectRestaurantMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Restaurant.update(id, { is_approved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      toast.success('Restaurant status updated');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_open }) => base44.entities.Restaurant.update(id, { is_open }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      toast.success('Status updated');
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: async ({ id }) => {
      // Delete all menu items first
      const items = allMenuItems.filter(item => item.restaurant_id === id);
      await Promise.all(items.map(item => base44.entities.MenuItem.delete(item.id)));
      
      // Delete all categories
      const cats = allCategories.filter(cat => cat.restaurant_id === id);
      await Promise.all(cats.map(cat => base44.entities.MenuCategory.delete(cat.id)));
      
      // Delete restaurant
      await base44.entities.Restaurant.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-restaurants']);
      queryClient.invalidateQueries(['all-menu-items']);
      queryClient.invalidateQueries(['all-menu-categories']);
      setSelectedRestaurant(null);
      toast.success('Restaurant deleted successfully');
    },
  });

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && r.is_approved) ||
                         (filterStatus === 'pending' && !r.is_approved);
    return matchesSearch && matchesFilter;
  });

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Restaurants</h1>
            <p className="text-gray-500 mt-1">Approve and manage restaurant partners</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
              <p className="text-sm text-gray-500">Total Restaurants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {restaurants.filter(r => r.is_approved).length}
              </p>
              <p className="text-sm text-gray-500">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">
                {restaurants.filter(r => !r.is_approved).length}
              </p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No restaurants found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Store className="w-8 h-8 text-orange-600" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                          <p className="text-sm text-gray-500">{restaurant.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={restaurant.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {restaurant.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                          <Badge className={restaurant.is_open ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                            {restaurant.is_open ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {restaurant.address}, {restaurant.city}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {restaurant.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {restaurant.owner_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Store className="w-4 h-4" />
                          Owner: {restaurant.owner_name}
                        </div>
                      </div>

                      <div className="flex gap-4 mb-4 p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Menu Items</p>
                          <p className="text-lg font-bold text-orange-600">
                            {getRestaurantMenuItems(restaurant.id).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Categories</p>
                          <p className="text-lg font-bold text-blue-600">
                            {getRestaurantCategories(restaurant.id).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rating</p>
                          <p className="text-lg font-bold text-gray-900">
                            {restaurant.rating || 0} ⭐
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRestaurant(restaurant)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        {!restaurant.is_approved ? (
                          <Button
                            size="sm"
                            onClick={() => approveRestaurantMutation.mutate({ id: restaurant.id, name: restaurant.name })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRestaurantMutation.mutate({ id: restaurant.id })}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Revoke Approval
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatusMutation.mutate({ 
                            id: restaurant.id, 
                            is_open: !restaurant.is_open 
                          })}
                        >
                          {restaurant.is_open ? 'Close' : 'Open'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setRestaurantToDelete(restaurant);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Restaurant Details Dialog */}
        <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Restaurant Details</DialogTitle>
            </DialogHeader>
            {selectedRestaurant && (
              <div className="space-y-4">
                {selectedRestaurant.cover_image_url && (
                  <img 
                    src={selectedRestaurant.cover_image_url} 
                    alt="" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Restaurant Name</p>
                    <p className="font-medium">{selectedRestaurant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{selectedRestaurant.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{selectedRestaurant.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedRestaurant.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedRestaurant.email || selectedRestaurant.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                    <p className="font-medium">₦{selectedRestaurant.delivery_fee?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Min Order</p>
                    <p className="font-medium">₦{selectedRestaurant.min_order?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Time</p>
                    <p className="font-medium">{selectedRestaurant.delivery_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Opening Hours</p>
                    <p className="font-medium">
                      {selectedRestaurant.opening_time} - {selectedRestaurant.closing_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="font-medium">
                      {selectedRestaurant.rating || 0} ⭐ ({selectedRestaurant.total_reviews || 0} reviews)
                    </p>
                  </div>
                </div>

                {selectedRestaurant.cuisine_types?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Cuisine Types</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRestaurant.cuisine_types.map((cuisine, idx) => (
                        <Badge key={idx} variant="outline">{cuisine}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-gray-700">{selectedRestaurant.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Full Address</p>
                  <p className="text-gray-700">{selectedRestaurant.address}</p>
                </div>

                {/* Menu Items Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Menu Items ({getRestaurantMenuItems(selectedRestaurant.id).length})
                  </h3>
                  {getRestaurantMenuItems(selectedRestaurant.id).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No menu items added yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getRestaurantMenuItems(selectedRestaurant.id).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {item.images?.[0] && (
                            <img 
                              src={item.images[0]} 
                              alt="" 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-orange-600">₦{item.price?.toLocaleString()}</p>
                            <Badge 
                              variant="outline" 
                              className={item.is_available ? 'text-green-600' : 'text-gray-400'}
                            >
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Categories Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Menu Categories ({getRestaurantCategories(selectedRestaurant.id).length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getRestaurantCategories(selectedRestaurant.id).map((cat) => (
                      <Badge key={cat.id} variant="outline">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{restaurantToDelete?.name}</strong>? 
                This will permanently remove the restaurant, all its menu items, categories, and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRestaurantToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (restaurantToDelete) {
                    deleteRestaurantMutation.mutate({ id: restaurantToDelete.id });
                    setDeleteConfirmOpen(false);
                    setRestaurantToDelete(null);
                  }
                }}
              >
                Delete Restaurant
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
        </div>
        );
        }