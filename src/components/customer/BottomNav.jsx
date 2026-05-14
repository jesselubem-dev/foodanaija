import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home, ClipboardList, ShoppingBag, Settings } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, page: 'CustomerHome' },
  { label: 'Orders', icon: ClipboardList, page: 'OrderHistory' },
  { label: 'Cart', icon: ShoppingBag, page: 'Cart' },
  { label: 'Settings', icon: Settings, page: 'CustomerSettings' },
];

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
      <div className="border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2.5 max-w-full safe-area-inset-bottom">
          {navItems.map(({ label, icon: Icon, page }) => {
            const pageUrl = createPageUrl(page);
            const isActive = location.pathname === pageUrl || location.pathname.startsWith(pageUrl);
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(20); }}
                className="flex flex-col items-center gap-1 px-4 py-1.5 relative"
              >
                <div className={`relative p-2 rounded-2xl transition-all ${isActive ? 'bg-orange-50' : ''}`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                  {page === 'Cart' && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {label}
                </span>
                {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}