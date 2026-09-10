import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../../utils';
import { Home, ClipboardList, ShoppingBag, Settings } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, page: 'CustomerHome' },
  { label: 'Orders', icon: ClipboardList, page: 'OrderHistory' },
  { label: 'Cart', icon: ShoppingBag, page: 'Cart' },
  { label: 'Settings', icon: Settings, page: 'CustomerSettings' },
];

const MotionLink = motion(Link);
const SPRING = { type: 'spring', stiffness: 500, damping: 32, mass: 0.6 };

export default function BottomNav({ unreadChatCount = 0, user }) {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 500);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-t border-gray-100/80">
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-5 safe-area-inset-bottom max-w-md mx-auto">
        {navItems.map(({ label, icon: Icon, page }) => {
          const pageUrl = createPageUrl(page);
          const isActive = location.pathname === pageUrl || location.pathname.startsWith(pageUrl);
          return (
            <MotionLink
              key={page}
              to={createPageUrl(page)}
              whileTap={{ scale: 0.86 }}
              transition={SPRING}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(8); }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 relative flex-1"
            >
              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${
                    isActive ? 'text-orange-500' : 'text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {page === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </MotionLink>
          );
        })}
      </div>
    </div>
  );
}