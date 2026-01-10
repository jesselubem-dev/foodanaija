import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, ShoppingBag, History, User, LogOut, Moon, Sun, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function FloatingMenu({ cartCount = 0, userEmail }) {
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 gap-1 px-4 py-3">
        <Link to={createPageUrl('CustomerHome')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl"
          >
            <Home className="w-5 h-5 text-gray-700" />
            <span className="text-xs text-gray-600 font-medium">Home</span>
          </Button>
        </Link>

        <Link to={createPageUrl('Promos')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl"
          >
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">Promos</span>
          </Button>
        </Link>

        <Link to={createPageUrl('Cart')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl relative"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <span className="text-xs text-gray-600 font-medium">Cart</span>
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
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl"
          >
            <History className="w-5 h-5 text-gray-700" />
            <span className="text-xs text-gray-600 font-medium">Orders</span>
          </Button>
        </Link>

        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl"
            >
              <User className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-600 font-medium">Profile</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mb-2" align="end">
            <div className="max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-3">
                <h3 className="font-semibold text-gray-900">Menu</h3>
              </div>

              <div className="p-2 space-y-1">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors text-left"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">My Profile</span>
                </button>

                <div className="border-t my-2"></div>

                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-orange-500 text-white">{unreadCount}</Badge>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">No notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            notification.is_read ? 'bg-gray-50' : 'bg-orange-50'
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsReadMutation.mutate(notification.id);
                            }
                          }}
                        >
                          <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t my-2"></div>

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Logout</span>
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}