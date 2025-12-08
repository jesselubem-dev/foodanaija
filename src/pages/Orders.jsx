import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, 
  ChevronRight, MapPin, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700', icon: Package },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function Orders() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1">
          <TabsTrigger 
            value="active" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="past"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Past Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            [1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
              <p className="text-gray-500 text-sm mb-4">Your active orders will appear here</p>
              <Link to={createPageUrl('Home')}>
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  Order Now
                </Button>
              </Link>
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            [1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))
          ) : pastOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past orders</h3>
              <p className="text-gray-500 text-sm">Your order history will appear here</p>
            </div>
          ) : (
            pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{order.restaurant_name}</h3>
            <p className="text-xs text-gray-500">
              {order.created_date && format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <Badge className={`${status.color} gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-3">
          {order.items?.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <img 
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50'} 
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>
          )}
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-1">{order.delivery_address}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-emerald-600">₦{order.total?.toLocaleString()}</span>
          <Button variant="ghost" size="sm" className="text-emerald-600">
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Status Progress for Active Orders */}
      {['pending', 'accepted', 'preparing', 'ready'].includes(order.status) && (
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            {['pending', 'accepted', 'preparing', 'ready'].map((step, idx) => {
              const stepIndex = ['pending', 'accepted', 'preparing', 'ready'].indexOf(order.status);
              const isCompleted = idx <= stepIndex;
              const isCurrent = idx === stepIndex;
              
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1 ${isCurrent ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-1 ${
                      idx < stepIndex ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}