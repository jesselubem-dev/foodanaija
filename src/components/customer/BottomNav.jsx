import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home, ClipboardList, ShoppingCart, Settings } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, page: 'CustomerHome' },
  { label: 'Orders', icon: ClipboardList, page: 'OrderHistory' },
  { label: 'Cart', icon: ShoppingCart, page: 'Cart' },
  { label: 'Settings', icon: Settings, page: 'CustomerSettings' },
];

export default function BottomNav({ unreadChatCount = 0 }) {
  const location = useLocation();

  const handleClick = () => {
    if (navigator.vibrate) navigator.vibrate(30);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ label, icon: Icon, page }) => {
            const pageUrl = createPageUrl(page);
            const isActive = location.pathname === pageUrl || location.pathname.startsWith(pageUrl);
            const hasUnread = false;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={handleClick}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 relative"
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500 shadow-lg shadow-orange-500/30'
                    : 'bg-transparent'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {hasUnread && (
                    <span className="absolute top-1 right-3 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}