import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NoInternet() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">No Internet Connection</h1>
          <p className="text-gray-600 mb-8">
            Please check your internet connection and try again.
          </p>

          <Button 
            onClick={handleReload}
            className="bg-gradient-to-r from-orange-500 to-orange-600 w-full h-12"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}