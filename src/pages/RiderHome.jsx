import React, { useEffect, useState } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Bike, Package, Clock, MapPin, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function RiderHome() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      
      // Check if user is a registered rider
      const riders = await base44.entities.Rider.filter({ email: userData.email });
      if (riders.length > 0) {
        window.location.href = createPageUrl('RiderDashboard');
        return;
      }
      
      // User is logged in but not a rider - log them out
      await base44.auth.logout(createPageUrl('RiderHome'));
      setIsLoggedIn(false);
    } catch (e) {
      // Not logged in - show login form
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoggingIn(true);

    try {
      // Redirect to login page with email pre-filled
      // The platform will handle authentication
      base44.auth.redirectToLogin(window.location.href);
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      setLoggingIn(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rider Login</h1>
          <p className="text-gray-600">Enter your credentials to start delivering</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              placeholder="rider@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="h-12"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="h-12"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loggingIn}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-lg rounded-xl"
          >
            {loggingIn ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-700">Manage your deliveries</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-700">Track your earnings</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Don't have credentials? Contact admin</p>
        </div>
      </div>
    </div>
  );
}