import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

function BannerSlide({ banner, onBannerClick }) {
  const from = banner.bg_gradient_from || '#FF6B35';
  const to = banner.bg_gradient_to || '#F7931E';
  const accent = banner.accent_color || '#FFD700';

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer h-36 md:h-44 flex-shrink-0 w-full"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      onClick={() => onBannerClick(banner)}
    >
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: accent }} />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15" style={{ background: accent }} />
      <div className="absolute top-1/2 right-4 w-12 h-12 rounded-full opacity-10" style={{ background: 'white' }} />

      <div className="relative h-full flex flex-col justify-between p-4">
        {/* Badge */}
        <div>
          <span
            className="inline-flex items-center gap-1 rounded-full font-bold text-[10px] px-2.5 py-1 shadow-md"
            style={{ background: accent, color: '#1a1a1a' }}
          >
            {banner.badge_text || '🔥 SPECIAL OFFER'}
          </span>
        </div>

        {/* Content row */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 text-white min-w-0">
            <div className="font-black text-lg leading-tight mb-0.5 line-clamp-1">
              {banner.emoji && <span className="mr-1">{banner.emoji}</span>}
              {banner.title || 'SPECIAL DEAL'}
            </div>
            <p className="text-white/80 text-xs leading-snug line-clamp-1">
              {banner.subtitle || 'Limited time offer'}
            </p>

            {/* Menu item */}
            {banner.menu_item_name && (
              <div className="flex items-center gap-2 mt-2 bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1 w-fit max-w-[180px]">
                {banner.menu_item_image ? (
                  <img src={banner.menu_item_image} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <span className="text-sm">🍽️</span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white text-[10px] leading-tight truncate">{banner.menu_item_name}</p>
                  {banner.menu_item_price && (
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-white text-[10px]">₦{banner.menu_item_price?.toLocaleString()}</p>
                      {banner.menu_item_slashed_price > 0 && (
                        <p className="text-white/60 line-through text-[9px]">₦{banner.menu_item_slashed_price?.toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div
            className="text-center font-bold rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap flex-shrink-0"
            style={{ background: accent, color: '#1a1a1a' }}
          >
            {banner.cta_text || 'Order Now'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback static banners when no DB banners available
const staticBanners = [
  {
    id: 'static-1',
    bg_gradient_from: '#FF6B35',
    bg_gradient_to: '#F7931E',
    accent_color: '#FFD700',
    badge_text: '⚡ FAST DELIVERY',
    emoji: '🚀',
    title: 'Get It Fast',
    subtitle: 'Delivered to your door in 30-45 mins',
    cta_text: 'Order Now',
  },
  {
    id: 'static-2',
    bg_gradient_from: '#7C3AED',
    bg_gradient_to: '#EC4899',
    accent_color: '#FDE68A',
    badge_text: '👨‍🍳 TOP CHEFS',
    emoji: '🍛',
    title: 'Best Naija Food',
    subtitle: 'From the best local restaurants near you',
    cta_text: 'Explore',
  },
  {
    id: 'static-3',
    bg_gradient_from: '#059669',
    bg_gradient_to: '#10B981',
    accent_color: '#FCD34D',
    badge_text: '🎉 NEW DISHES',
    emoji: '🥘',
    title: 'Fresh & Hot',
    subtitle: 'New dishes added every week',
    cta_text: 'See Menu',
  },
];

export default function BannerCarousel({ onAddToCart }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: dbBanners = [] } = useQuery({
    queryKey: ['active-promo-banners'],
    queryFn: () => base44.entities.PromoBanner.filter({ is_active: true }),
    staleTime: 60000,
  });

  const banners = dbBanners.length > 0 ? dbBanners : staticBanners;

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleBannerClick = (banner) => {
    if (banner.menu_item_id && onAddToCart) {
      onAddToCart(banner);
    }
  };

  const prev = () => setCurrentSlide((p) => (p - 1 + banners.length) % banners.length);
  const next = () => setCurrentSlide((p) => (p + 1) % banners.length);

  return (
    <div className="mb-6 relative">
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
          >
            <BannerSlide banner={banners[currentSlide]} onBannerClick={handleBannerClick} />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 bg-orange-500' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}