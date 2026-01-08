import React, { useEffect, useState } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Bike, Package, Clock, MapPin, Mail, Lock, TrendingUp, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function RiderHome() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        const userData = await base44.auth.me();
        // Redirect authenticated users to dashboard
        window.location.href = createPageUrl('RiderDashboard');
        return;
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    base44.auth.redirectToLogin(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show sign up form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex flex-col safe-area-inset-bottom">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mb-4 shadow-2xl">
          <Bike className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
          Foodanaija Rider
        </h1>
        <p className="text-gray-600 text-center text-sm md:text-base">Deliver. Earn. Grow.</p>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-4 pb-4 space-y-4">
        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Get Started</h2>
          <p className="text-gray-600 text-sm mb-6">Join thousands of riders earning daily</p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                className="h-12 text-base rounded-lg border-2 border-gray-200 focus:border-blue-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isAuthenticating}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md active:scale-95 transition-all"
            >
              {isAuthenticating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating...</span>
                </div>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Sign Up & Start
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-2">
          <FeatureCard icon={Package} label="Orders" color="blue" />
          <FeatureCard icon={TrendingUp} label="Earnings" color="green" />
          <FeatureCard icon={MapPin} label="Track" color="orange" />
        </div>

        {/* Demo & Info */}
        <div className="space-y-2">
          <Button
            onClick={() => window.location.href = createPageUrl('RiderDashboard?demo=true')}
            variant="outline"
            className="w-full h-11 rounded-lg border-2 active:scale-95 transition-all"
          >
            👀 View Demo
          </Button>
          <p className="text-xs text-gray-600 text-center">
            🔒 Secure • No password needed
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, label, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-lg p-3 text-center border border-gray-100 shadow-sm active:scale-95 transition-all">
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-lg flex items-center justify-center mx-auto mb-1`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
    </div>
  );
}