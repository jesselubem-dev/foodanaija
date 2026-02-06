import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, History, ShoppingBag, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageProvider } from '../components/LanguageContext';

function ProfileContent() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cart = JSON.parse(savedCart);
          setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20),
    enabled: !!user?.email,
    refetchInterval: 20000,
    staleTime: 15000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <Card className="border-orange-100 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <span className="text-2xl font-bold">{user.full_name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.full_name}</h2>
                <p className="text-sm text-white/80">{user.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-900">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-orange-500 text-white">{unreadCount}</Badge>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      notification.is_read 
                        ? 'bg-gray-50 border-gray-100' 
                        : 'bg-orange-50 border-orange-200 shadow-sm'
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-orange-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('OrderHistory')}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <History className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Order History</p>
                    <p className="text-xs text-gray-500">View your past orders</p>
                  </div>
                </button>
              </Link>

              <Link to={createPageUrl('Cart')}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">My Cart</p>
                    <p className="text-xs text-gray-500">{cartCount} items</p>
                  </div>
                </button>
              </Link>

              <Link to={createPageUrl('DeleteAccount')}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left border border-red-100">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900">Delete Account</p>
                    <p className="text-xs text-red-600">Permanently remove your account</p>
                  </div>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          className="w-full bg-red-500 hover:bg-red-600 text-white h-12"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <LanguageProvider>
      <ProfileContent />
    </LanguageProvider>
  );
}