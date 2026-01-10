import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, ShoppingBag, History, User, LogOut, Moon, Sun, Bell, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function FloatingMenu({ cartCount = 0, userEmail }) {
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // Load user data
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail,
    refetchInterval: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 safe-area-inset-bottom transition-colors">
      <div className="grid grid-cols-6 gap-1 px-4 py-3">
        <Link to={createPageUrl('CustomerHome')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl"
          >
            <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Home</span>
          </Button>
        </Link>

        <Link to={createPageUrl('Promos')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl"
          >
            <Sparkles className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Promos</span>
          </Button>
        </Link>

        <Link to={createPageUrl('Cart')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl relative"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-6 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>

        <Link to={createPageUrl('OrderHistory')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl"
          >
            <History className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Orders</span>
          </Button>
        </Link>

        <Link to={createPageUrl('CustomerSupport')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl"
          >
            <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Support</span>
          </Button>
        </Link>

        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl"
            >
              <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Profile</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <div className="h-full flex flex-col">
              {/* Header with User Info */}
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{user?.full_name || 'Guest'}</h2>
                    <p className="text-sm text-white/80">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
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
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
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
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t">
                    <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Link to={createPageUrl('OrderHistory')}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left border border-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <History className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Order History</p>
                            <p className="text-xs text-gray-500">View past orders</p>
                          </div>
                        </button>
                      </Link>

                      <Link to={createPageUrl('Cart')}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left border border-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">My Cart</p>
                            <p className="text-xs text-gray-500">{cartCount} items</p>
                          </div>
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="pt-4 border-t">
                    <h3 className="font-bold text-gray-900 mb-3">Settings</h3>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                      onClick={toggleDarkMode}
                    >
                      <div className="flex items-center gap-3">
                        {darkMode ? (
                          <Sun className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Moon className="w-5 h-5 text-gray-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${
                        darkMode ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${
                          darkMode ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer with Logout */}
              <div className="p-4 border-t bg-gray-50">
                <button
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-white font-medium"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}