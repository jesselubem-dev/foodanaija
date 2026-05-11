import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { X, ChefHat, Sparkles, Clock, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function PromoModal({ promoItems, onClose }) {
  const now = new Date();
  const activePromos = promoItems.filter(item => {
    if (!item.promo_start_date || !item.promo_end_date) return true;
    const end = new Date(item.promo_end_date);
    return now <= end;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (activePromos.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activePromos.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activePromos.length]);

  if (!isVisible || activePromos.length === 0) return null;

  const currentPromo = activePromos[currentIndex];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

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
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-10 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header Badge */}
              <div className="relative pt-6 px-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [-2, 2, -2]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-yellow-400 text-orange-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  🔥 SPECIAL PROMO
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 text-white">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  Limited Time Offer!
                </h2>
                <p className="text-orange-100 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
                  Order now and enjoy amazing deals
                </p>

                {/* Promo Item Showcase */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 mb-4 sm:mb-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex gap-3 sm:gap-4 flex-1">
                        {/* Item Image */}
                        <div className="flex-shrink-0">
                          {currentPromo.images?.[0] ? (
                            <img
                              src={currentPromo.images[0]}
                              alt={currentPromo.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl object-cover shadow-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                              <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 text-white/70" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 line-clamp-2 sm:line-clamp-1">
                            {currentPromo.name}
                          </h3>
                          <p className="text-orange-100 text-xs sm:text-sm mb-2 line-clamp-2">
                            {currentPromo.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {currentPromo.restaurant?.logo_url ? (
                              <img
                                src={currentPromo.restaurant.logo_url}
                                alt=""
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center">
                                <ChefHat className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <span className="text-xs sm:text-sm font-medium line-clamp-1">
                              {currentPromo.restaurant?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Tag */}
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <div className="bg-yellow-400 text-orange-900 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold text-center shadow-lg">
                          <div className="text-xs">Only</div>
                          <div className="text-lg sm:text-xl">₦{currentPromo.price?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Indicators for multiple promos */}
                {activePromos.length > 1 && (
                  <div className="flex justify-center gap-2 mb-4 sm:mb-6">
                    {activePromos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentIndex
                            ? 'w-8 bg-yellow-400'
                            : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <Link to={createPageUrl(`RestaurantDetail?id=${currentPromo.restaurant_id}&item=${currentPromo.id}`)}>
                  <Button
                    onClick={handleClose}
                    className="w-full h-12 sm:h-14 bg-white hover:bg-gray-100 text-orange-600 font-bold text-base sm:text-lg rounded-xl shadow-xl flex items-center justify-center gap-2 group"
                  >
                    Order Now
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </Button>
                </Link>

                <p className="text-center text-orange-100 text-xs sm:text-sm mt-3">
                  ⏱️ Limited time offer • While stocks last
                </p>
              </div>
            </div>

            {/* Decorative floating elements */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full opacity-20 blur-xl"
            />
            <motion.div
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-400 rounded-full opacity-20 blur-xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}