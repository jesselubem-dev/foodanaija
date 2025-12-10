import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LocationCheck({ onLocationVerified }) {
  const [checking, setChecking] = useState(true);
  const [inServiceArea, setInServiceArea] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = () => {
    setChecking(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Sokoto, Nigeria coordinates (approximate city center)
        const sokotoLat = 13.0059;
        const sokotoLon = 5.2476;
        
        // Calculate distance (rough approximation)
        const distance = getDistanceFromLatLonInKm(latitude, longitude, sokotoLat, sokotoLon);
        
        // If within ~50km of Sokoto, consider it in service area
        const isInSokoto = distance < 50;
        
        setInServiceArea(isInSokoto);
        setChecking(false);
        
        if (isInSokoto) {
          onLocationVerified();
        }
      },
      (err) => {
        setError('Unable to access your location. Please enable location services.');
        setChecking(false);
      }
    );
  };

  // Calculate distance between two coordinates in km
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-100">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-orange-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Your Location</h2>
            <p className="text-gray-600">Please allow location access to continue...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-100">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Access Required</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={checkLocation} className="bg-orange-600 hover:bg-orange-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inServiceArea === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-100">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sorry! 😔</h2>
            <p className="text-gray-600 mb-2">
              We're not available in your area yet.
            </p>
            <p className="text-lg font-semibold text-orange-600 mb-4">
              Currently serving: Sokoto, Nigeria only
            </p>
            <div className="bg-orange-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                We're working hard to expand to more locations. Check back soon!
              </p>
            </div>
            <Button onClick={checkLocation} variant="outline" className="border-orange-200">
              Check Location Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}