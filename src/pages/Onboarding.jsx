import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '../utils';
import { UtensilsCrossed, ShoppingCart, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    icon: UtensilsCrossed,
    title: 'Discover great food',
    description: 'Explore delicious meals from the best restaurants in Sokoto.',
    tint: 'f-tint-gold',
    iconBg: 'bg-fooda-gold',
    iconColor: 'f-on-gold',
  },
  {
    icon: ShoppingCart,
    title: 'Order in minutes',
    description: 'Pick your dishes, pay securely and you are done — just a few taps.',
    tint: 'f-tint-green',
    iconBg: 'bg-fooda-green',
    iconColor: 'text-white',
  },
  {
    icon: Bike,
    title: 'Fast delivery',
    description: 'Track your order live and get it hot and fresh at your door.',
    tint: 'f-tint-gold',
    iconBg: 'bg-fooda-gold',
    iconColor: 'f-on-gold',
  },
];

const AUTO_ADVANCE_MS = 4500;

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const isLast = currentSlide === SLIDES.length - 1;

  const finish = () => {
    localStorage.setItem('onboarding_completed', 'true');
    window.location.href = createPageUrl('CustomerHome');
  };

  // Auto-advance through the intro slides, but never past the last one:
  // the customer taps "Get started" themselves.
  useEffect(() => {
    if (isLast || paused) return;
    const timer = setTimeout(() => setCurrentSlide(s => Math.min(s + 1, SLIDES.length - 1)), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [currentSlide, isLast, paused]);

  const handleNext = () => {
    if (isLast) finish();
    else setCurrentSlide(currentSlide + 1);
  };

  const handlePrevious = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const onTouchStart = (e) => { setPaused(true); touchStart.current = e.targetTouches[0].clientX; touchEnd.current = 0; };
  const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (touchStart.current && touchEnd.current) {
      const distance = touchStart.current - touchEnd.current;
      if (distance > 50 && !isLast) setCurrentSlide(currentSlide + 1);
      if (distance < -50) handlePrevious();
    }
    touchStart.current = 0;
    touchEnd.current = 0;
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Top bar */}
      <div className="flex items-center justify-between h-10">
        <span className="text-[17px] font-bold text-gray-900 tracking-tight">
          Fooda<span className="f-text-gold">.</span>
        </span>
        {!isLast && (
          <button onClick={finish} className="text-[14px] font-medium text-gray-500 hover:text-gray-900 px-2 py-1">
            Skip
          </button>
        )}
      </div>

      {/* Slide */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center touch-pan-y select-none max-w-sm w-full mx-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center"
          >
            <div className={`w-56 h-56 rounded-full ${slide.tint} flex items-center justify-center mb-10`}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                className={`w-32 h-32 rounded-[2rem] ${slide.iconBg} flex items-center justify-center shadow-lg`}
              >
                <Icon className={`w-14 h-14 ${slide.iconColor}`} strokeWidth={1.8} />
              </motion.div>
            </div>
            <h1 className="text-[28px] font-semibold text-gray-900 leading-tight">{slide.title}</h1>
            <p className="text-[15px] text-gray-500 mt-2.5 max-w-[280px]">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress + actions */}
      <div className="max-w-sm w-full mx-auto">
        <div className="flex justify-center gap-2 mb-6" role="tablist" aria-label="Intro slides">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Slide ${index + 1}`}
              onClick={() => { setPaused(true); setCurrentSlide(index); }}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-fooda-gold' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl text-[15px] font-semibold uppercase tracking-wide f-btn-gold press"
        >
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
