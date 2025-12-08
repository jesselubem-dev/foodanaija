import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChefHat, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="gradient-text">Fooda Niger</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Partner with us and grow your restaurant business. Manage your menu, orders, and reach more customers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('RestaurantSetup')}>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/30">
                <Store className="w-5 h-5 mr-2" />
                Register Your Restaurant
              </Button>
            </Link>
            <Link to={createPageUrl('DashboardHome')}>
              <Button variant="outline" className="border-2 border-emerald-200 px-8 py-6 text-lg rounded-2xl">
                Restaurant Dashboard
              </Button>
            </Link>
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