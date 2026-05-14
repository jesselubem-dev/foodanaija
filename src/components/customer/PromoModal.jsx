import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { X, ShoppingBag, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PromoModal({ promoItems, onClose }) {
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

  useEffect(() => {
    const items = mode === 'banner' ? activeBanners : activePromos;
    if (items.length > 1) {
      const interval = setInterval(() => setCurrentIndex(prev => (prev + 1) % items.length), 4500);
      return () => clearInterval(interval);
    }
  }, [mode, activeBanners]);

  const now = new Date();
  const activePromos = promoItems.filter(item => {
    if (!item.promo_end_date) return true;
    return now <= new Date(item.promo_end_date);
  });

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAddToCart = (banner) => {
    if (!banner.menu_item_id) return;
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
      toast.success(`${banner.menu_item_name} added to cart! 🛒`);
      handleClose();
    } catch {
      toast.error('Could not add to cart');
    }
  };

  if (!isVisible) return null;
  if (mode === 'loading') return null;

  // BANNER MODE — show AI-generated promo banners
  if (mode === 'banner' && activeBanners.length > 0) {
    const current = activeBanners[currentIndex];
    const from = current.bg_gradient_from || '#FF6B35';
    const to = current.bg_gradient_to || '#F7931E';
    const accent = current.accent_color || '#FFD700';

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm"
            >
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute -top-3 -right-3 z-20 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              {/* Banner Card */}
              <div
                className="rounded-3xl overflow-hidden shadow-2xl relative"
                style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
              >
                {/* Decorative */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: accent }} />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-15" style={{ background: accent }} />

                <div className="relative p-6">
                  {/* Badge */}
                  <motion.span
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md mb-4"
                    style={{ background: accent, color: '#1a1a1a' }}
                  >
                    {current.badge_text || '🔥 SPECIAL OFFER'}
                  </motion.span>

                  {/* Headline */}
                  <h2 className="text-3xl font-black text-white leading-tight mb-1">
                    {current.emoji && <span className="mr-1">{current.emoji}</span>}
                    {current.title}
                  </h2>
                  <p className="text-white/80 text-sm mb-5">{current.subtitle}</p>

                  {/* Menu Item Card */}
                  {current.menu_item_id && (
                    <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-5 flex items-center gap-4">
                      {current.menu_item_image ? (
                        <img src={current.menu_item_image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">{current.emoji || '🍽️'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-base leading-tight">{current.menu_item_name}</p>
                        <p className="text-white/70 text-xs mt-0.5">{current.restaurant_name}</p>
                        {current.menu_item_price && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div
                              className="inline-block px-2.5 py-1 rounded-lg text-xs font-black shadow"
                              style={{ background: accent, color: '#1a1a1a' }}
                            >
                              ₦{current.menu_item_price?.toLocaleString()}
                            </div>
                            {current.menu_item_slashed_price && (
                              <span className="text-xs text-white/60 line-through">
                                ₦{current.menu_item_slashed_price?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handleAddToCart(current)}
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
                    style={{ background: accent, color: '#1a1a1a' }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {current.cta_text || 'Add to Cart'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-center text-white/50 text-xs mt-3">Tap outside to dismiss</p>
                </div>

                {/* Dots indicator */}
                {activeBanners.length > 1 && (
                  <div className="flex justify-center gap-1.5 pb-4">
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-6' : 'w-1.5 opacity-40'}`}
                        style={{ background: i === currentIndex ? accent : 'white' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // PROMO MODE — fallback to menu item promos
  if (activePromos.length === 0) return null;
  const currentPromo = activePromos[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm"
          >
            <button onClick={handleClose} className="absolute -top-3 -right-3 z-20 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-yellow-400 opacity-20" />
              <div className="p-6">
                <motion.span
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-1.5 bg-yellow-400 text-orange-900 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 🔥 SPECIAL PROMO
                </motion.span>

                <h2 className="text-2xl font-black text-white mb-1">Limited Time Offer!</h2>
                <p className="text-white/80 text-sm mb-4">Order now and enjoy amazing deals</p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white/15 border border-white/20 rounded-2xl p-4 mb-5 flex items-center gap-3"
                  >
                    {currentPromo.images?.[0] ? (
                      <img src={currentPromo.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white leading-tight">{currentPromo.name}</p>
                      <p className="text-white/70 text-xs mt-0.5">{currentPromo.restaurant?.name}</p>
                      <div className="bg-yellow-400 text-orange-900 inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-black">
                        ₦{currentPromo.price?.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {activePromos.length > 1 && (
                  <div className="flex justify-center gap-1.5 mb-4">
                    {activePromos.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all bg-yellow-400 ${i === currentIndex ? 'w-6' : 'w-1.5 opacity-40'}`} />
                    ))}
                  </div>
                )}

                <Link to={createPageUrl(`RestaurantDetail?id=${currentPromo.restaurant_id}&item=${currentPromo.id}`)}>
                  <button
                    onClick={() => {
                      toast.success(`${currentPromo.name} added to cart! 🎉`);
                      handleClose();
                    }}
                    className="w-full bg-white text-orange-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  >
                    Order Now <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <p className="text-center text-white/50 text-xs mt-3">⏱️ Limited time • While stocks last</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}