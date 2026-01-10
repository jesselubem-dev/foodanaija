import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NoInternet() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to fetch a small resource
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Check immediately
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    // Also listen to browser events
    const handleOnline = () => {
      checkConnection();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
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
          
          <div className="mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png"
              alt="Fooda Naija"
              className="h-16 w-auto mx-auto mb-4"
            />
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