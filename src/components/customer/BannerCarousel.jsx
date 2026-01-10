import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronRight, Sparkles, Zap, ChefHat, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      gradient: 'from-orange-500 to-amber-500',
      icon: Sparkles,
      title: '🔥 Special Deals',
      subtitle: 'View all active promos & discounts',
      link: 'Promos'
    },
    {
      id: 2,
      gradient: 'from-blue-500 to-cyan-500',
      icon: Zap,
      title: '⚡ Fast Delivery',
      subtitle: 'Get your food delivered in 30-45 mins',
      link: 'CustomerHome'
    },
    {
      id: 3,
      gradient: 'from-purple-500 to-pink-500',
      icon: ChefHat,
      title: '👨‍🍳 Top Restaurants',
      subtitle: 'Order from the best local restaurants',
      link: 'CustomerHome'
    },
    {
      id: 4,
      gradient: 'from-green-500 to-emerald-500',
      icon: Clock,
      title: '⏰ Order Anytime',
      subtitle: 'Available 24/7 for your convenience',
      link: 'CustomerHome'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          <Link to={createPageUrl(banners[currentSlide].link)}>
            <div className={`p-4 bg-gradient-to-r ${banners[currentSlide].gradient} hover:shadow-xl transition-all cursor-pointer`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                  >
                    {React.createElement(banners[currentSlide].icon, { className: "w-6 h-6" })}
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{banners[currentSlide].title}</h3>
                    <p className="text-sm text-white/90">{banners[currentSlide].subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}