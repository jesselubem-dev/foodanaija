import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { X, ShoppingCart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Fooda defaults when an admin banner has no colours set.
const DEFAULT_FROM = '#0B4D33';
const DEFAULT_TO = '#157A4C';
const DEFAULT_ACCENT = '#F5B700';

function Backdrop({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-md f-float press"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Dots({ count, index, onSelect, color }) {
  if (count < 2) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show offer ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6' : 'w-1.5 opacity-40'}`}
          style={{ background: i === index ? color : '#ffffff' }}
        />
      ))}
    </div>
  );
}

export default function PromoModal({ promoItems, onClose }) {
  const navigate = useNavigate();
  const [activeBanners, setActiveBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mode, setMode] = useState('loading'); // 'loading' | 'banner' | 'promo'

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const banners = await base44.entities.PromoBanner.filter({ is_active: true });
        const now = new Date();
        const valid = banners.filter(b => !b.expires_at || new Date(b.expires_at) > now);
        if (valid.length > 0) {
          setActiveBanners(valid);
          setMode('banner');
        } else {
          setMode('promo');
        }
      } catch {
        setMode('promo');
      }
    };
    loadBanners();
  }, []);

  const now = new Date();
  const activePromos = promoItems.filter(item => !item.promo_end_date || now <= new Date(item.promo_end_date));
  const itemCount = mode === 'banner' ? activeBanners.length : activePromos.length;

  // Auto-advance between offers.
  useEffect(() => {
    if (itemCount > 1) {
      const interval = setInterval(() => setCurrentIndex(prev => (prev + 1) % itemCount), 4500);
      return () => clearInterval(interval);
    }
  }, [mode, itemCount]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAddToCart = (banner) => {
    if (!banner.menu_item_id) { handleClose(); return; }
    try {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]');
      const found = existing.find(i => i.item_id === banner.menu_item_id);
      let newCart;
      if (found) {
        newCart = existing.map(i => i.item_id === banner.menu_item_id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newCart = [...existing, {
          item_id: banner.menu_item_id,
          name: banner.menu_item_name,
          price: banner.menu_item_price,
          quantity: 1,
          image_url: banner.menu_item_image,
          restaurant_id: banner.restaurant_id,
          restaurant_name: banner.restaurant_name,
        }];
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
      toast.success(`${banner.menu_item_name} added to your order`);
      handleClose();
      setTimeout(() => navigate(createPageUrl('Cart')), 350);
    } catch {
      toast.error('Could not add to your order');
    }
  };

  if (!isVisible || mode === 'loading' || itemCount === 0) return null;
  const index = currentIndex % itemCount;

  // BANNER MODE — admin promo banners
  if (mode === 'banner') {
    const current = activeBanners[index];
    const from = current.bg_gradient_from || DEFAULT_FROM;
    const to = current.bg_gradient_to || DEFAULT_TO;
    const accent = current.accent_color || DEFAULT_ACCENT;

    return (
      <AnimatePresence>
        <Backdrop onClose={handleClose}>
          <div
            className="rounded-3xl overflow-hidden shadow-2xl p-5 pt-6"
            style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
          >
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
              style={{ background: accent, color: '#111111' }}
            >
              {current.badge_text || 'Special offer'}
            </span>

            <h2 className="text-[26px] font-bold text-white leading-tight mt-3 pr-8">
              {current.emoji && <span className="mr-1">{current.emoji}</span>}
              {current.title}
            </h2>
            {current.subtitle && <p className="text-white/85 text-[14px] mt-1">{current.subtitle}</p>}

            {current.menu_item_id && (
              <div className="mt-4 rounded-2xl p-3 flex items-center gap-3 f-float">
                {current.menu_item_image ? (
                  <img src={current.menu_item_image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl f-tint-gold flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">{current.emoji || '🍽️'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] leading-tight truncate">{current.menu_item_name}</p>
                  <p className="text-[12px] f-text-muted truncate">{current.restaurant_name}</p>
                  {current.menu_item_price != null && (
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[15px] font-bold">₦{Number(current.menu_item_price).toLocaleString()}</span>
                      {current.menu_item_slashed_price > 0 && (
                        <span className="text-[12px] f-text-muted line-through">₦{Number(current.menu_item_slashed_price).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => handleAddToCart(current)}
              className="mt-4 w-full h-14 rounded-2xl font-semibold text-[14px] uppercase tracking-wide flex items-center justify-center gap-2 press"
              style={{ background: accent, color: '#111111' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {current.cta_text || 'Add to order'}
            </button>

            <Dots count={activeBanners.length} index={index} onSelect={setCurrentIndex} color={accent} />
          </div>
        </Backdrop>
      </AnimatePresence>
    );
  }

  // PROMO MODE — menu items marked as promos
  const currentPromo = activePromos[index];

  return (
    <AnimatePresence>
      <Backdrop onClose={handleClose}>
        <div className="rounded-3xl overflow-hidden shadow-2xl p-5 pt-6 bg-gradient-to-br from-fooda-green to-fooda-green-light">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase f-btn-gold">
            Limited time
          </span>
          <h2 className="text-[26px] font-bold text-white leading-tight mt-3 pr-8">Today's deals</h2>
          <p className="text-white/85 text-[14px] mt-1">Special prices while stocks last</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-4 rounded-2xl p-3 flex items-center gap-3 f-float"
            >
              {currentPromo.images?.[0] ? (
                <img src={currentPromo.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl f-tint-gold flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🍽️</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] leading-tight truncate">{currentPromo.name}</p>
                <p className="text-[12px] f-text-muted truncate">{currentPromo.restaurant?.name}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-[15px] font-bold">₦{Number(currentPromo.price || 0).toLocaleString()}</span>
                  {currentPromo.slashed_price > 0 && (
                    <span className="text-[12px] f-text-muted line-through">₦{Number(currentPromo.slashed_price).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => {
              handleClose();
              navigate(createPageUrl(`RestaurantDetail?id=${currentPromo.restaurant_id}&item=${currentPromo.id}`));
            }}
            className="mt-4 w-full h-14 rounded-2xl font-semibold text-[14px] uppercase tracking-wide flex items-center justify-center gap-1 f-btn-gold press"
          >
            View deal <ChevronRight className="w-4 h-4" />
          </button>

          <Dots count={activePromos.length} index={index} onSelect={setCurrentIndex} color="#F5B700" />
        </div>
      </Backdrop>
    </AnimatePresence>
  );
}