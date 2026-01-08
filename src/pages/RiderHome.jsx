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

  // Show login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <Bike className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Foodanaija Rider
          </h1>
          <p className="text-gray-600 text-lg">Deliver. Earn. Grow.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full h-14 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {loggingIn ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Logging in...</span>
                </div>
              ) : (
                <>
                  <Navigation className="w-5 h-5 mr-2" />
                  Start Delivering
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <FeatureCard icon={Package} label="Orders" color="blue" />
          <FeatureCard icon={TrendingUp} label="Earnings" color="green" />
          <FeatureCard icon={MapPin} label="Track" color="orange" />
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl py-3 px-4">
            🔒 Secure rider portal • Need access? Contact admin
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('RiderDashboard?demo=true')}
            variant="outline"
            className="w-full rounded-xl"
          >
            👀 View Demo Dashboard
          </Button>
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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-gray-100 hover:shadow-lg transition-all">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mx-auto mb-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
    </div>
  );
}