import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MenuItemCard({ item, onAddToCart, isInCart }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-emerald-50 flex">
      {/* Image */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-medium">Unavailable</span>
          </div>
        )}
        {item.is_popular && item.is_available && (
          <Badge className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm text-[10px]">
            Popular
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">{item.name}</h4>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-emerald-600">₦{item.price?.toLocaleString()}</span>
          
          {item.is_available && (
            <Button
              size="sm"
              onClick={() => onAddToCart(item)}
              className={`h-8 w-8 rounded-full p-0 transition-all ${
                isInCart 
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}