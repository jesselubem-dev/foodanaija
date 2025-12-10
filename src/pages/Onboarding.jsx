import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { ChefHat, MapPin, ShoppingBag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: ChefHat,
      title: 'Discover Restaurants',
      description: 'Browse hundreds of restaurants and cuisines in your city',
      color: 'orange',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=600&fit=crop'
    },
    {
      icon: ShoppingBag,
      title: 'Order Your Favorites',
      description: 'Add items to cart and customize your order',
      color: 'yellow',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop'
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Get your food delivered hot and fresh to your doorstep',
      color: 'amber',
      image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=600&fit=crop'
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

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    window.location.href = createPageUrl('CustomerHome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentSlide ? 'block' : 'hidden'
                  }`}
                >
                  <div className="mb-8">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-80 h-80 object-cover rounded-3xl mx-auto shadow-2xl"
                    />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{slide.title}</h1>
                  <p className="text-lg text-gray-600 mb-8">{slide.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-orange-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-lg"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Button>
            {currentSlide < slides.length - 1 && (
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full h-12 text-gray-600"
              >
                Skip
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}