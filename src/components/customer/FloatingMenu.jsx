import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, ShoppingBag, History, User, LogOut, Bell, MessageSquare, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useLanguage } from '../LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function FloatingMenu({ cartCount = 0, userEmail }) {
  const { t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('CustomerHome');
  const queryClient = useQueryClient();

  const handleTabClick = (pageName) => {
    if (currentPage === pageName) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
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

    // Track current page
    const path = window.location.pathname;
    if (path.includes('OrderHistory')) setCurrentPage('OrderHistory');
    else if (path.includes('Cart')) setCurrentPage('Cart');
    else if (path.includes('LiveChat')) setCurrentPage('LiveChat');
    else setCurrentPage('CustomerHome');
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, is_read: false }, '-created_date', 20),
    enabled: !!userEmail,
    refetchInterval: 20000, // 20 seconds
    staleTime: 15000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;



  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 safe-area-inset-bottom transition-colors"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
    >
      <motion.div 
        className="grid grid-cols-5 gap-1 px-4 py-3"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <button onClick={() => { handleTabClick('CustomerHome'); if (currentPage !== 'CustomerHome') window.location.href = createPageUrl('CustomerHome'); }}>
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Home className={`w-5 h-5 ${currentPage === 'CustomerHome' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
              </motion.div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('home')}</span>
            </Button>
          </motion.div>
        </button>

        <button onClick={() => { handleTabClick('LiveChat'); if (currentPage !== 'LiveChat') window.location.href = createPageUrl('LiveChat'); }}>
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageSquare className={`w-5 h-5 ${currentPage === 'LiveChat' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
              </motion.div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('chat')}</span>
            </Button>
          </motion.div>
        </button>

        <button onClick={() => { handleTabClick('OrderHistory'); if (currentPage !== 'OrderHistory') window.location.href = createPageUrl('OrderHistory'); }}>
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              <History className={`w-5 h-5 ${currentPage === 'OrderHistory' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('orders')}</span>
            </Button>
          </motion.div>
        </button>

        <button onClick={() => { handleTabClick('Cart'); if (currentPage !== 'Cart') window.location.href = createPageUrl('Cart'); }}>
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl relative transition-all"
            >
              <motion.div
                animate={cartCount > 0 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <ShoppingBag className={`w-5 h-5 ${currentPage === 'Cart' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
              </motion.div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('cart')}</span>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute top-1 right-6 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {cartCount}
                </motion.span>
              )}
            </Button>
          </motion.div>
        </button>

        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetTrigger asChild>
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <User className={`w-6 h-6 ${profileOpen ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('profile')}</span>
              </Button>
            </motion.div>
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
                        <h3 className="font-bold text-gray-900">{t('notifications')}</h3>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-orange-500 text-white">{unreadCount}</Badge>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t('noNotifications')}</p>
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
                    <h3 className="font-bold text-gray-900 mb-3">{t('quickActions')}</h3>
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
                            <p className="text-sm font-semibold text-gray-900">{t('orderHistory')}</p>
                            <p className="text-xs text-gray-500">{t('viewPastOrders')}</p>
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
                            <p className="text-sm font-semibold text-gray-900">{t('myCart')}</p>
                            <p className="text-xs text-gray-500">{cartCount} {t('items')}</p>
                          </div>
                        </button>
                      </Link>

                      <Link to={createPageUrl('DeleteAccount')}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left border border-red-100"
                          onClick={() => setProfileOpen(false)}
                        >
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
                  {t('logout')}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </motion.div>
        </motion.div>
        );
        }