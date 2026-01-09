import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Home, ShoppingBag, History, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingMenu({ cartCount = 0 }) {
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

        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-red-50 rounded-xl"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-6 h-6 text-red-600" />
          <span className="text-xs text-red-600 font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}