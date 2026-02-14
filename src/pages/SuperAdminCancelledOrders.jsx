import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SuperAdminCancelledOrders() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const markRefundedMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { refunded: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast.success('Order marked as refunded');
    },
    onError: () => {
      toast.error('Failed to update refund status');
    }
  });

  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const filteredOrders = cancelledOrders.filter(order => {
    const matchesSearch = 
      order.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'refunded' && order.refunded) ||
      (filterStatus === 'not_refunded' && !order.refunded);

    return matchesSearch && matchesFilter;
  });

  const refundedCount = cancelledOrders.filter(o => o.refunded).length;
  const notRefundedCount = cancelledOrders.filter(o => !o.refunded).length;
  const totalRefundAmount = cancelledOrders.filter(o => !o.refunded).reduce((sum, o) => sum + (o.total || 0), 0);

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
        <div className="mb-8">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cancelled Orders Management</h1>
          <p className="text-gray-500 mt-1">Track and manage refunds for cancelled orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cancelled</p>
                  <p className="text-3xl font-bold text-gray-900">{cancelledOrders.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Refunded</p>
                  <p className="text-3xl font-bold text-green-600">{refundedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Not Refunded</p>
                  <p className="text-3xl font-bold text-red-600">{notRefundedCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Refund Amount</p>
                  <p className="text-2xl font-bold text-orange-600">₦{totalRefundAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by restaurant, customer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="not_refunded">Not Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Cancelled Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No cancelled orders found</p>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{order.restaurant_name}</p>
                            <Badge className={order.refunded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {order.refunded ? 'Refunded' : 'Not Refunded'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Customer: {order.customer_name} ({order.customer_email})
                          </p>
                          <p className="text-sm text-gray-500">
                            Order ID: {order.id.slice(0, 8)}... • Cancelled: {new Date(order.created_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Payment: {order.payment_method?.toUpperCase() || 'N/A'} • {order.payment_status}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">₦{order.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                      </div>
                      {!order.refunded && (
                        <Button
                          onClick={() => markRefundedMutation.mutate(order.id)}
                          disabled={markRefundedMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Refunded
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}