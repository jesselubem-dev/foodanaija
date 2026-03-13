import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Bike, Package, Clock, CheckCircle, MapPin, Star, Phone, User, Navigation, LogOut, TrendingUp, Menu, X, MessageSquare
} from 'lucide-react';
import ComplaintsSheet from '../components/rider/ComplaintsSheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import NoInternet from '../components/NoInternet';

const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/9ad72bcd8_20260225_165100.png";

export default function RiderDashboard() {
  const [user, setUser] = useState(null);
  const [rider, setRider] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [showAlreadyTaken, setShowAlreadyTaken] = useState(false);

  useEffect(() => {
    checkRider();
    requestNotificationPermission();
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.loop = true;
    audio.volume = 0.5;
    setAudioElement(audio);
    return () => { if (audio) { audio.pause(); audio.currentTime = 0; } };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const checkRider = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === 'true';
    if (isDemo) {
      setRider({ id: 'demo-123', full_name: 'Chioma Adeyemi', email: 'chioma@example.com', phone: '08012345678', vehicle_type: 'motorcycle', vehicle_number: 'KJA-456-AA', is_active: true, is_available: true, total_deliveries: 24, rating: 4.8 });
      return;
    }
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.href); return; }
      const userData = await base44.auth.me();
      setUser(userData);
      let riders = await base44.entities.Rider.filter({ email: userData.email });
      if (riders.length === 0) {
        const newRider = await base44.entities.Rider.create({ full_name: userData.full_name || 'Rider', email: userData.email, phone: userData.phone || '', vehicle_type: 'motorcycle', is_active: true, is_available: true, total_deliveries: 0, rating: 5 });
        setRider(newRider);
        return;
      }
      setRider(riders[0]);
    } catch (e) { console.error('Rider check failed:', e); }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const acceptedOrders = await base44.entities.Order.filter({ status: 'accepted' }, '-created_date');
      return acceptedOrders.filter(o => o.delivery_status !== 'delivered');
    },
    enabled: !!rider,
    refetchInterval: 5000,
  });

  const { data: deliveredOrders = [] } = useQuery({
    queryKey: ['delivered-orders', rider?.id],
    queryFn: () => base44.entities.Order.filter({ rider_id: rider.id, delivery_status: 'delivered' }, '-updated_date'),
    enabled: !!rider,
  });

  const toggleAvailability = async () => {
    await base44.entities.Rider.update(rider.id, { is_available: !rider.is_available });
    setRider({ ...rider, is_available: !rider.is_available });
  };

  const myActiveOrders = rider ? orders.filter(o => o.rider_id === rider.id && ['assigned', 'picked_up', 'on_the_way'].includes(o.delivery_status)) : [];
  const unassignedOrders = orders.filter(o => !o.rider_id && o.delivery_status === 'unassigned');
  const todayCompleted = deliveredOrders.filter(o => new Date(o.updated_date).toDateString() === new Date().toDateString());
  const todayEarnings = todayCompleted.reduce((sum, o) => sum + ((o.delivery_fee || 500) * (o.total_restaurants_in_batch || 1)), 0);
  const allTimeEarnings = deliveredOrders.reduce((sum, o) => sum + ((o.delivery_fee || 500) * (o.total_restaurants_in_batch || 1)), 0);

  useEffect(() => {
    if (unassignedOrders.length > previousOrderCount && previousOrderCount > 0) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const latestOrder = unassignedOrders[0];
        new Notification('🚨 New Delivery Available!', { body: `${latestOrder.restaurant_name}\n₦${latestOrder.total?.toLocaleString()} • ${latestOrder.items?.length} items`, tag: 'new-order', requireInteraction: true });
      }
    }
    setPreviousOrderCount(unassignedOrders.length);
  }, [unassignedOrders.length]);

  useEffect(() => {
    if (audioElement) {
      if (unassignedOrders.length > 0 && rider?.is_available) { audioElement.play().catch(() => {}); }
      else { audioElement.pause(); audioElement.currentTime = 0; }
    }
  }, [unassignedOrders.length, rider?.is_available, audioElement]);

  if (!rider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <img src={LOGO} alt="Fooda Naija" className="h-16 w-auto mb-6" />
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ maxWidth: 480, margin: '0 auto' }}>
      <NoInternet />

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Fooda Naija" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-xs text-gray-400">Welcome back,</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">{rider.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Online/Offline toggle pill */}
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                rider.is_available 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${rider.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {rider.is_available ? 'Online' : 'Offline'}
            </button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Menu className="w-4 h-4 text-gray-700" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left flex items-center gap-2">
                    <img src={LOGO} alt="Fooda Naija" className="h-8 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{rider.full_name}</p>
                      <p className="text-xs text-gray-500">{rider.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-gray-50 rounded-2xl text-center">
                      <p className="text-2xl font-bold text-gray-900">{rider.total_deliveries}</p>
                      <p className="text-xs text-gray-500">Deliveries</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <p className="text-2xl font-bold text-gray-900">{rider.rating}</p>
                      </div>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>
                  <button
                    onClick={() => base44.auth.logout(createPageUrl('RiderHome'))}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Available" value={unassignedOrders.length} color="red" />
          <MiniStat label="Active" value={myActiveOrders.length} color="orange" />
          <MiniStat label="Today" value={todayCompleted.length} color="green" />
          <MiniStat label="Earnings" value={`₦${(todayEarnings/1000).toFixed(0)}k`} color="blue" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-24">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 h-auto">
            <TabsTrigger value="available" className="rounded-xl py-2 text-xs data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-none">
              <span className="flex flex-col items-center gap-0.5">
                <Package className="w-3.5 h-3.5" />
                <span>{unassignedOrders.length}</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl py-2 text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-none">
              <span className="flex flex-col items-center gap-0.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>{myActiveOrders.length}</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="today" className="rounded-xl py-2 text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-none">
              <span className="flex flex-col items-center gap-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{todayCompleted.length}</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2 text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-none">
              <span className="flex flex-col items-center gap-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>All</span>
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available">
            {unassignedOrders.length === 0 ? (
              <EmptyState icon={Package} title="No Available Orders" subtitle="Check back soon for new deliveries" />
            ) : (
              <div className="space-y-3">
                {unassignedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden relative">
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-6">
                          <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mb-1">🚨 New Order</span>
                          <h3 className="text-base font-bold text-gray-900">{order.restaurant_name}</h3>
                          {order.batch_order_id && (
                            <span className="inline-block text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mt-1">🔗 Batch ({order.total_restaurants_in_batch} restaurants)</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                          <p className="text-xs text-green-600 font-semibold">+₦{((order.delivery_fee || 500) * (order.total_restaurants_in_batch || 1)).toLocaleString()} fee</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customer_name}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.items?.length} items</span>
                      </div>
                      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-2.5 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{order.delivery_address}</span>
                      </div>
                      <button
                        className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const currentOrder = await base44.entities.Order.filter({ id: order.id });
                            if (currentOrder[0].delivery_status !== 'unassigned') {
                              setShowAlreadyTaken(true);
                              setTimeout(() => window.location.reload(), 2000);
                              return;
                            }
                            await base44.entities.Order.update(order.id, { rider_id: rider.id, rider_name: rider.full_name, delivery_status: 'assigned', accepted_at: new Date().toISOString() });
                            window.location.href = createPageUrl(`RiderDelivery?id=${order.id}`);
                          } catch (error) { alert('Failed to accept order. Please try again.'); }
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept & Start Delivery
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Deliveries */}
          <TabsContent value="active">
            {myActiveOrders.length === 0 ? (
              <EmptyState icon={Navigation} title="No Active Deliveries" subtitle="Accept an order to start delivering" />
            ) : (
              <div className="space-y-3">
                {myActiveOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <span className="inline-block text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1">
                            {order.delivery_status === 'picked_up' ? '📦 Picked Up' : '🚴 On The Way'}
                          </span>
                          <h3 className="text-base font-bold text-gray-900">{order.restaurant_name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{order.items?.length} items</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <User className="w-3 h-3" />{order.customer_name} • {order.customer_phone}
                      </div>
                      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-2.5 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{order.delivery_address}</span>
                      </div>
                      <Link to={createPageUrl(`RiderDelivery?id=${order.id}`)}>
                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Continue Delivery
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Today's Completed */}
          <TabsContent value="today">
            {todayCompleted.length === 0 ? (
              <EmptyState icon={CheckCircle} title="No Completed Deliveries Today" subtitle="Start delivering to see your completed orders" />
            ) : (
              <div className="space-y-2">
                {todayCompleted.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.restaurant_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-sm">+₦{((order.delivery_fee || 500) * (order.total_restaurants_in_batch || 1)).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {deliveredOrders.length === 0 ? (
              <EmptyState icon={Clock} title="No Delivery History" subtitle="Your completed deliveries will appear here" />
            ) : (
              <div className="space-y-2">
                {deliveredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{order.restaurant_name}</p>
                          <p className="text-xs text-gray-500">{order.customer_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(order.updated_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">₦{order.total?.toLocaleString()}</p>
                        <p className="text-xs text-green-600 font-medium">+₦{((order.delivery_fee || 500) * (order.total_restaurants_in_batch || 1)).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-start gap-1.5 bg-gray-50 rounded-xl p-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{order.delivery_address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-gray-100 shadow-2xl z-50 safe-area-inset-bottom" style={{ maxWidth: 480 }}>
        <div className="grid grid-cols-3 gap-1 px-4 py-2">
          <button
            onClick={toggleAvailability}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rider.is_available ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Bike className={`w-4 h-4 ${rider.is_available ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <span className={`text-xs font-medium ${rider.is_available ? 'text-green-600' : 'text-gray-400'}`}>
              {rider.is_available ? 'Online' : 'Offline'}
            </span>
          </button>

          <ComplaintsSheet rider={rider} />

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">Profile</span>
          </button>
        </div>
      </div>

      {/* Already Taken Modal */}
      {showAlreadyTaken && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4" style={{ maxWidth: 480, margin: '0 auto', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
              <p className="text-4xl mb-2">😔</p>
              <h3 className="text-xl font-bold text-white">Order Already Taken</h3>
              <p className="text-red-100 text-sm">Another rider got there first!</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-gray-600 text-sm mb-4">Keep your status as <span className="font-semibold text-green-600">Online</span> to catch the next one.</p>
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                Refreshing orders...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className={`rounded-2xl p-2.5 text-center ${colors[color]}`}>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs opacity-80 mt-0.5">{label}</p>
    </div>
  );
}