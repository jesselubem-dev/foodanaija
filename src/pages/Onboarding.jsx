import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { ChefHat, ShoppingBag, Bike, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = [
  {
    icon: ChefHat,
    title: 'Discover Amazing Food',
    description: 'Explore delicious meals from the best restaurants in Sokoto',
    gradient: 'from-orange-400 via-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100'
  },
  {
    icon: ShoppingBag,
    title: 'Order in Minutes',
    description: 'Quick and easy ordering with just a few taps',
    gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100'
  },
  {
    icon: Bike,
    title: 'Fast Delivery',
    description: 'Get your food delivered hot and fresh to your doorstep',
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100'
  }
];


  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('onboarding_completed', 'true');
      window.location.href = createPageUrl('CustomerHome');
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    window.location.href = createPageUrl('CustomerHome');
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    }

    if (distance < -minSwipeDistance) {
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col relative overflow-hidden">
      {/* Animated background shapes */}
      <motion.div 
        className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="p-6 flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-md w-full">

          {/* Logo */}
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="touch-pan-y select-none"
          >
          <AnimatePresence mode="wait">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return index === currentSlide ? (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-center"
                >
                  {/* Animated Icon Container */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20,
                      delay: 0.1 
                    }}
                    className="relative mx-auto mb-12 w-48 h-48"
                  >
                    {/* Pulsing background */}
                    <motion.div 
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.bgGradient} opacity-50`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Main circle */}
                    <motion.div 
                      className={`absolute inset-4 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}
                      animate={{ 
                        boxShadow: [
                          "0 20px 60px rgba(0,0,0,0.2)",
                          "0 30px 80px rgba(0,0,0,0.3)",
                          "0 20px 60px rgba(0,0,0,0.2)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Icon className="w-20 h-20 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Sparkles */}
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.5, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Sparkles className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </motion.div>

                  <motion.h1 
                    className="text-4xl font-bold text-gray-900 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {slide.title}
                  </motion.h1>
                  
                  <motion.p 
                    className="text-lg text-gray-600 mb-8 px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {slide.description}
                  </motion.p>
                </motion.div>
              ) : null;
            })}
          </AnimatePresence>
          </div>

          {/* Swipe indicator */}
          <motion.div 
            className="flex justify-center items-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: currentSlide < slides.length - 1 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ x: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-gray-400 text-sm font-medium"
            >
              Swipe to continue
            </motion.div>
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-orange-500"
            >
              →
            </motion.div>
          </motion.div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-gradient-to-r from-orange-500 to-orange-600'
                    : 'w-2 bg-gray-300'
                }`}
                whileHover={{ scale: 1.2 }}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          {/* Buttons */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleNext}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg font-semibold rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Button>
            {currentSlide < slides.length - 1 && (
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full h-14 text-gray-600 hover:text-gray-900 text-base rounded-2xl"
              >
                Skip for now
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}