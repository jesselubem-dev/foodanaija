import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Home, ShoppingBag, History, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingMenu({ cartCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 mb-2">
          <Link to={createPageUrl('Cart')}>
            <Button
              className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 text-gray-700 shadow-lg flex items-center justify-center relative"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          
          <Link to={createPageUrl('OrderHistory')}>
            <Button
              className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 text-gray-700 shadow-lg flex items-center justify-center"
              onClick={() => setIsOpen(false)}
            >
              <History className="w-6 h-6" />
            </Button>
          </Link>
          
          <Button
            className="w-14 h-14 rounded-full bg-white hover:bg-red-50 text-red-600 shadow-lg flex items-center justify-center"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Main Toggle Button */}
      <Button
        className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-2xl flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Menu className="w-7 h-7 text-white" />
        )}
      </Button>
    </div>
  );
}