import React, { useEffect, useState } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Bike, Package, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RiderHome() {
  const [user, setUser] = useState(null);
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRider();
  }, []);

  const checkRider = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const riders = await base44.entities.Rider.filter({ email: userData.email });
      if (riders.length > 0) {
        setRider(riders[0]);
        window.location.href = createPageUrl('RiderDashboard');
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rider Portal</h1>
          <p className="text-gray-600">You need to be registered as a rider to access this portal</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">Manage your deliveries</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">Track your earnings</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">Real-time navigation</span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Contact the admin to register as a rider</p>
          <p className="mt-2">Email: support@foodanaija.com</p>
        </div>

        <Button
          onClick={() => base44.auth.logout()}
          variant="outline"
          className="w-full mt-6"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}