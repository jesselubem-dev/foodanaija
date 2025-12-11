import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { ChefHat, MapPin, ShoppingBag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = [
  {
    icon: ChefHat,
    title: 'Discover Restaurants',
    description: 'Browse hundreds of restaurants and cuisines in your city',
    color: 'orange'
  },
  {
    icon: ShoppingBag,
    title: 'Order Your Favorites',
    description: 'Add items to cart and customize your order',
    color: 'yellow'
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    description: 'Get your food delivered hot and fresh to your doorstep',
    color: 'amber'
  }];


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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex flex-col">
      <div className="bg-stone-50 p-6 flex-1 flex items-center justify-center">
        <div
          className="max-w-md w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

          <div className="text-center">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                  index === currentSlide ? 'block' : 'hidden'}`
                  }>

                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-${slide.color}-500 to-${slide.color}-600 flex items-center justify-center mx-auto mb-8 shadow-xl`}>
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{slide.title}</h1>
                  <p className="text-lg text-gray-600 mb-8">{slide.description}</p>
                </div>);

            })}
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) =>
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ?
              'w-8 bg-orange-600' :
              'w-2 bg-gray-300'}`
              } />

            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-lg">

              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Button>
            {currentSlide < slides.length - 1 &&
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full h-12 text-gray-600">

                Skip
              </Button>
            }
          </div>
        </div>
      </div>
    </div>);

}