import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RamadanBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show until March 18th 2026
    const endDate = new Date('2026-03-19T00:00:00');
    const now = new Date();
    if (now >= endDate) return;

    // Show once per session
    const seen = sessionStorage.getItem('ramadan_banner_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem('ramadan_banner_seen', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f1b3d 0%, #1a3a6b 40%, #0d2747 70%, #0a1628 100%)',
            }}
          >
            {/* Stars background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: Math.random() * 3 + 1 + 'px',
                    height: Math.random() * 3 + 1 + 'px',
                    top: Math.random() * 60 + '%',
                    left: Math.random() * 100 + '%',
                    opacity: Math.random() * 0.7 + 0.2,
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Top crescent & lanterns decoration */}
            <div className="relative pt-8 pb-2 flex flex-col items-center">
              {/* Lanterns */}
              <div className="flex items-end justify-center gap-6 mb-3">
                <div className="flex flex-col items-center">
                  <div className="w-1 h-6 bg-yellow-400/60" />
                  <div className="w-8 h-12 rounded-b-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-yellow-400/50 shadow-lg shadow-red-500/30 flex items-center justify-center">
                    <div className="w-3 h-6 rounded-full bg-yellow-300/40 animate-pulse" />
                  </div>
                  <div className="w-3 h-2 bg-yellow-400/60 rounded-b" />
                </div>

                {/* Moon & star center */}
                <div className="text-5xl mb-2 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px gold)' }}>
                  🌙
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-1 h-6 bg-yellow-400/60" />
                  <div className="w-8 h-12 rounded-b-full bg-gradient-to-b from-emerald-500 to-emerald-700 border-2 border-yellow-400/50 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                    <div className="w-3 h-6 rounded-full bg-yellow-300/40 animate-pulse" />
                  </div>
                  <div className="w-3 h-2 bg-yellow-400/60 rounded-b" />
                </div>
              </div>

              {/* Decorative arch line */}
              <div className="w-48 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent mb-4" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 text-center relative z-10">
              <p className="text-yellow-300 text-sm font-medium tracking-widest uppercase mb-1">
                رمضان مبارك
              </p>
              <h2 className="text-white text-2xl font-extrabold leading-tight mb-1">
                Ramadan Special Deals 🌙
              </h2>
              <p className="text-yellow-200/90 text-base font-semibold mb-4">
                Order before Maghrib & enjoy exclusive offers!
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-500/40" />
                <span className="text-yellow-400 text-lg">✦</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-500/40" />
              </div>

              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                Celebrate the holy month with your favourite Nigerian dishes. 
                Fast-breaking meals delivered fresh to your door. 🍛
              </p>

              {/* CTA Button */}
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl font-bold text-base text-white shadow-lg transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(90deg, #c6910a 0%, #f5c518 50%, #c6910a 100%)',
                  boxShadow: '0 4px 20px rgba(197, 145, 10, 0.5)',
                  color: '#1a0a00',
                }}
              >
                🌙 Explore Deals Now
              </button>

              <p className="text-white/40 text-xs mt-3">
                Offer valid until 18th March 2026
              </p>
            </div>

            {/* Bottom decorative row */}
            <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #c6910a, #f5c518, #c6910a)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}