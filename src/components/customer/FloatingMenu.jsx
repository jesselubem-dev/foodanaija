import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Home, ShoppingBag, History, User, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function FloatingMenu({ cartCount = 0 }) {
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
      <div className="grid grid-cols-4 gap-1 px-4 py-3">
        <Link to={createPageUrl('CustomerHome')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl"
          >
            <Home className="w-6 h-6 text-gray-700" />
            <span className="text-xs text-gray-600 font-medium">Home</span>
          </Button>
        </Link>

        <Link to={createPageUrl('Cart')}>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50 rounded-xl relative"
          >
            <ShoppingBag className="w-6 h-6 text-gray-700" />
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
            <History className="w-6 h-6 text-gray-700" />
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
          <PopoverContent className="w-48 p-2 mb-2" align="end">
            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors text-left"
                onClick={() => setProfileOpen(false)}
              >
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">My Profile</span>
              </button>
              
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
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}