import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bike, Plus, Search, CheckCircle, XCircle, Phone, Mail, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SuperAdminRiders() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRider, setNewRider] = useState({
    full_name: '',
    email: '',
    phone: '',
    vehicle_type: 'motorcycle',
    vehicle_number: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
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

  const { data: riders = [] } = useQuery({
    queryKey: ['riders'],
    queryFn: () => base44.entities.Rider.list(),
    enabled: !!user,
  });

  const createRiderMutation = useMutation({
    mutationFn: (data) => base44.entities.Rider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['riders']);
      setShowAddDialog(false);
      setNewRider({
        full_name: '',
        email: '',
        phone: '',
        vehicle_type: 'motorcycle',
        vehicle_number: ''
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.Rider.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['riders']);
    },
  });

  const filteredRiders = riders.filter(r =>
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone?.includes(searchTerm)
  );

  const activeRiders = riders.filter(r => r.is_active);
  const totalDeliveries = riders.reduce((sum, r) => sum + (r.total_deliveries || 0), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispatch Riders</h1>
            <p className="text-gray-500 mt-1">Manage delivery riders</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-500 hover:bg-blue-600 rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Rider
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{riders.length}</p>
                  <p className="text-sm text-gray-600">Total Riders</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bike className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{activeRiders.length}</p>
                  <p className="text-sm text-gray-600">Active Riders</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{totalDeliveries}</p>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Riders List */}
        <Card>
          <CardHeader>
            <CardTitle>All Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRiders.map((rider) => (
                <div key={rider.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <Bike className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{rider.full_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {rider.email}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {rider.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{rider.vehicle_type}</Badge>
                        <span className="text-xs text-gray-500">{rider.vehicle_number}</span>
                        <span className="text-xs text-gray-500">• {rider.total_deliveries || 0} deliveries</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={rider.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActiveMutation.mutate({ 
                        id: rider.id, 
                        is_active: !rider.is_active 
                      })}
                      className="rounded-xl"
                    >
                      {rider.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Rider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={newRider.full_name}
              onChange={(e) => setNewRider({...newRider, full_name: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newRider.email}
              onChange={(e) => setNewRider({...newRider, email: e.target.value})}
            />
            <Input
              placeholder="Phone Number"
              value={newRider.phone}
              onChange={(e) => setNewRider({...newRider, phone: e.target.value})}
            />
            <Select
              value={newRider.vehicle_type}
              onValueChange={(value) => setNewRider({...newRider, vehicle_type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Vehicle Number"
              value={newRider.vehicle_number}
              onChange={(e) => setNewRider({...newRider, vehicle_number: e.target.value})}
            />
            <Button
              onClick={() => createRiderMutation.mutate(newRider)}
              disabled={createRiderMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {createRiderMutation.isPending ? 'Adding...' : 'Add Rider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}