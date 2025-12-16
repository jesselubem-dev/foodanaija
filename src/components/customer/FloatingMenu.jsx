import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Home, ShoppingBag, History, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingMenu({ cartCount = 0 }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Menu Items - Always Visible Horizontally */}
      <div className="flex items-center gap-3 bg-white rounded-full shadow-2xl px-4 py-3">
        <Link to={createPageUrl('CustomerHome')}>
          <Button
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
          >
            <Home className="w-5 h-5" />
          </Button>
        </Link>
        
        <Link to={createPageUrl('Cart')}>
          <Button
            className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center relative"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
        
        <Link to={createPageUrl('OrderHistory')}>
          <Button
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
          >
            <History className="w-5 h-5" />
          </Button>
        </Link>
        
        <Button
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-50 text-red-600 flex items-center justify-center"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}