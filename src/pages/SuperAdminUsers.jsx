import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, User, Calendar, ArrowLeft, Search, Shield, UserPlus, Trash2, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SuperAdminUsers() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [activeTab, setActiveTab] = useState('users');
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

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    enabled: !!user,
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user,
  });

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRestaurant = (userEmail) => {
    return restaurants.find(r => r.owner_email === userEmail);
  };

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      return await base44.auth.inviteUser(email, role);
    },
    onSuccess: () => {
      toast.success('User invited successfully!');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('user');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to invite user');
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      return await base44.entities.User.update(userId, { role: newRole });
    },
    onSuccess: () => {
      toast.success('User role updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  const { data: deletionRequests = [] } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: () => base44.entities.AccountDeletionRequest.list('-created_date'),
    enabled: !!user,
  });

  const processDeletionMutation = useMutation({
    mutationFn: async ({ requestId, status, userEmail }) => {
      await base44.entities.AccountDeletionRequest.update(requestId, {
        status,
        processed_by: user.email,
        processed_at: new Date().toISOString()
      });
      if (status === 'approved') {
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.entities.User.delete(users[0].id);
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'approved' ? 'Account deleted successfully' : 'Request rejected');
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process request');
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('SuperAdminDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-gray-500 mt-1">View all registered users</p>
            </div>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {inviteRole === 'admin' && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Admin users will have full access to the Super Admin Dashboard
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleInviteUser}
                  disabled={inviteUserMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('deletions')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'deletions' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Deletion Requests
            {deletionRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {deletionRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'deletions' ? (
          <div className="space-y-4">
            {deletionRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No deletion requests</p>
                </CardContent>
              </Card>
            ) : (
              deletionRequests.map((req) => (
                <Card key={req.id} className={`border-l-4 ${req.status === 'pending' ? 'border-l-yellow-400' : req.status === 'approved' ? 'border-l-green-400' : 'border-l-red-400'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{req.user_name}</p>
                          {req.status === 'pending' && <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Pending</span>}
                          {req.status === 'approved' && <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Approved</span>}
                          {req.status === 'rejected' && <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Rejected</span>}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{req.user_email}</p>
                        {req.reason && <p className="text-sm text-gray-600 italic">"{req.reason}"</p>}
                        <p className="text-xs text-gray-400 mt-2">{format(new Date(req.created_date), 'MMM d, yyyy • h:mm a')}</p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={processDeletionMutation.isPending}
                            onClick={() => processDeletionMutation.mutate({ requestId: req.id, status: 'approved', userEmail: req.user_email })}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processDeletionMutation.isPending}
                            onClick={() => processDeletionMutation.mutate({ requestId: req.id, status: 'rejected', userEmail: req.user_email })}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
        <>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-500">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => getUserRestaurant(u.email)).length}
              </p>
              <p className="text-sm text-gray-500">Restaurant Owners</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((u) => {
              const userRestaurant = getUserRestaurant(u.email);
              return (
                <Card key={u.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                        {u.full_name?.[0] || u.email[0].toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{u.full_name || 'User'}</h3>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {u.role === 'admin' && (
                              <Badge className="bg-red-100 text-red-700">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {userRestaurant && (
                              <Badge className="bg-blue-100 text-blue-700">
                                Restaurant Owner
                              </Badge>
                            )}
                            {u.user_type && (
                              <Badge variant="outline">{u.user_type}</Badge>
                            )}
                            {u.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRoleMutation.mutate({ userId: u.id, newRole: 'admin' })}
                                disabled={updateUserRoleMutation.isPending}
                                className="ml-2 text-xs"
                              >
                                Make Admin
                              </Button>
                            )}
                            {u.role === 'admin' && u.email !== 'tamirbe@base44.com' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRoleMutation.mutate({ userId: u.id, newRole: 'user' })}
                                disabled={updateUserRoleMutation.isPending}
                                className="ml-2 text-xs"
                              >
                                Remove Admin
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            Joined: {format(new Date(u.created_date), 'MMM d, yyyy')}
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              {u.phone}
                            </div>
                          )}
                        </div>

                        {userRestaurant && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              Owns: <span className="text-orange-600">{userRestaurant.name}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {userRestaurant.city} • {userRestaurant.is_approved ? '✓ Approved' : '⏳ Pending Approval'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}