import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Star, Clock, Bike } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FoodCard({ restaurant }) {
  return (
    <Link 
      to={createPageUrl(`Restaurant?id=${restaurant.id}`)}
      className="block group"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-emerald-50 hover:border-emerald-100">
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img 
            src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'} 
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${
              restaurant.is_open 
                ? 'bg-emerald-500/90 backdrop-blur-sm' 
                : 'bg-gray-500/90 backdrop-blur-sm'
            }`}
          >
            {restaurant.is_open ? 'Open' : 'Closed'}
          </Badge>

          {/* Delivery Time */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">{restaurant.delivery_time || '30-45 mins'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            {restaurant.rating && (
              <div className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-0.5 flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{restaurant.rating?.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-1 mb-3">
            {restaurant.cuisine_types?.join(' • ') || restaurant.description || 'Nigerian Cuisine'}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Bike className="w-4 h-4" />
              <span>₦{restaurant.delivery_fee?.toLocaleString() || 500}</span>
            </div>
            <span className="text-gray-400 text-xs">
              Min: ₦{restaurant.min_order?.toLocaleString() || 1000}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}