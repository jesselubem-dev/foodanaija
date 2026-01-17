import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { ChefHat, Store, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const handleRegisterClick = async () => {
    try {
      await base44.auth.me();
      window.location.href = createPageUrl('RestaurantSetup');
    } catch (e) {
      base44.auth.redirectToLogin(createPageUrl('RestaurantSetup'));
    }
  };

  const handleDashboardClick = async () => {
    try {
      const userData = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: userData.email });
      
      if (restaurants.length > 0) {
        window.location.href = createPageUrl('DashboardHome');
      } else {
        window.location.href = createPageUrl('RestaurantSetup');
      }
    } catch (e) {
      base44.auth.redirectToLogin(createPageUrl('RestaurantSetup'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/19f9697a7_foodalogo.jpeg" 
              alt="Fooda Naija" 
              className="h-24 w-auto object-contain mx-auto"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Partner with <span className="gradient-text">Fooda Naija</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Partner with us and grow your restaurant business. Manage your menu, orders, and reach more customers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleRegisterClick}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/30"
            >
              <Store className="w-5 h-5 mr-2" />
              Register Your Restaurant
            </Button>
            <Button 
              onClick={handleDashboardClick}
              variant="outline" 
              className="border-2 border-emerald-200 px-8 py-6 text-lg rounded-2xl"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Restaurant Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Partner With Us?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="🍽️"
            title="Easy Menu Management"
            description="Add your products with multiple images, prices, and descriptions. Update availability in real-time."
          />
          <FeatureCard 
            icon="📦"
            title="Order Management"
            description="Track and manage orders from customers. Update order status and communicate with customers."
          />
          <FeatureCard 
            icon="📊"
            title="Analytics & Insights"
            description="Monitor your sales, revenue, and performance with detailed analytics and reports."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-emerald-50 hover:shadow-lg transition-shadow">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}