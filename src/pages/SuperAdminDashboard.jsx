import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, ShoppingBag, TrendingUp, XCircle, Clock, ChevronRight,
  UtensilsCrossed, Bike, Wallet, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

const naira = (n) => `₦${Math.round(n || 0).toLocaleString()}`;

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  ready: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  unpaid: 'bg-red-50 text-red-700 border-red-200',
};

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      // Allow access if user is admin OR app creator
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['all-riders'],
    queryFn: () => base44.entities.Rider.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const pendingRestaurants = restaurants.filter(r => !r.is_approved);
  const activeRestaurants = restaurants.filter(r => r.is_approved);
  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredOrders = orders.filter(o => o.delivery_status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const unrefunded = cancelledOrders.filter(o => !o.refunded);
  const totalRiderEarnings = deliveredOrders.reduce((sum, o) => sum + (o.delivery_fee || 500), 0);
  const vasRevenue = paidOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
  const foodRevenue = totalRevenue - vasRevenue;
  const todayStr = new Date().toDateString();
  const todayOrders = orders
    .filter(o => new Date(o.created_date).toDateString() === todayStr)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const todayRevenue = todayOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const foodShare = totalRevenue > 0 ? (foodRevenue / totalRevenue) * 100 : 0;

  const restaurantRevenue = activeRestaurants.map(restaurant => {
    const rOrders = paidOrders.filter(o => o.restaurant_id === restaurant.id);
    return { ...restaurant, revenue: rOrders.reduce((s, o) => s + (o.total || 0), 0), orderCount: rOrders.length };
  }).sort((a, b) => b.revenue - a.revenue);
  const topRevenue = restaurantRevenue[0]?.revenue || 0;

  const riderEarnings = riders.map(rider => {
    const done = orders.filter(o => o.rider_id === rider.id && o.delivery_status === 'delivered');
    return { ...rider, earnings: done.reduce((s, o) => s + (o.delivery_fee || 500), 0), deliveryCount: done.length };
  }).sort((a, b) => b.earnings - a.earnings);

  const markRefundedMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, {
      refunded: true,
      refunded_at: new Date().toISOString(),
      refunded_by: user?.email,
    }),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ['all-orders'] });
      const previous = queryClient.getQueryData(['all-orders']);
      queryClient.setQueryData(['all-orders'], (old) =>
        Array.isArray(old) ? old.map(o => (o.id === orderId ? { ...o, refunded: true } : o)) : old
      );
      return { previous };
    },
    onSuccess: () => toast.success('Order marked as refunded'),
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['all-orders'], ctx.previous);
      toast.error(`Couldn't mark as refunded: ${err?.message || 'please try again'}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.full_name || '').split(' ')[0];

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
            <p className="text-gray-500 mt-1">Here's how Fooda Naija is doing today.</p>
          </div>
          <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-white border border-gray-200 text-[13px] text-gray-600 self-start sm:self-auto">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Revenue hero + today */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-fooda-green text-white p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute right-16 -bottom-16 w-40 h-40 rounded-full bg-fooda-gold/10" />
            <div className="relative">
              <p className="text-[13px] font-medium text-white/70">Total platform revenue</p>
              <p className="text-[34px] leading-tight font-bold tracking-tight mt-1">{naira(totalRevenue)}</p>
              <p className="text-[13px] text-white/60 mt-1">{paidOrders.length} paid orders · {deliveredOrders.length} delivered</p>

              <div className="mt-6">
                <div className="h-2 rounded-full bg-white/15 overflow-hidden flex">
                  <div className="h-full bg-fooda-gold" style={{ width: `${foodShare}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-[13px]">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-fooda-gold" />Food <b className="font-semibold">{naira(foodRevenue)}</b></span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-white/40" />Delivery (VAS) <b className="font-semibold">{naira(vasRevenue)}</b></span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 flex flex-col">
            <p className="text-[13px] font-medium text-gray-500">Today</p>
            <p className="text-[34px] leading-tight font-bold tracking-tight text-gray-900 mt-1">{todayOrders.length}</p>
            <p className="text-[13px] text-gray-500">orders placed</p>
            <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Paid revenue today</span>
              <span className="text-[15px] font-semibold text-gray-900">{naira(todayRevenue)}</span>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={Store} label="Restaurants" value={restaurants.length} sub={`${activeRestaurants.length} live`} to="SuperAdminRestaurants" />
          <Kpi icon={Clock} label="Pending approvals" value={pendingRestaurants.length} sub={pendingRestaurants.length ? 'Needs review' : 'All clear'} to="SuperAdminRestaurants" highlight={pendingRestaurants.length > 0} />
          <Kpi icon={Bike} label="Riders" value={riders.length} sub={`${riders.filter(r => r.is_available).length} available now`} to="SuperAdminRiders" />
          <Kpi icon={UtensilsCrossed} label="Menu items" value={menuItems.length} sub="Across all restaurants" to="SuperAdminAllMenus" />
          <Kpi icon={TrendingUp} label="Delivery revenue" value={naira(vasRevenue)} sub="From delivery fees" />
          <Kpi icon={Wallet} label="Rider earnings" value={naira(totalRiderEarnings)} sub={`${deliveredOrders.length} deliveries`} />
          <Kpi icon={ShoppingBag} label="All orders" value={orders.length} sub={`${orders.filter(o => o.status === 'pending').length} pending`} to="SuperAdminOrders" />
          <Kpi icon={XCircle} label="Cancelled" value={cancelledOrders.length} sub={`${unrefunded.length} awaiting refund`} to="SuperAdminCancelledOrders" warn={unrefunded.length > 0} />
        </div>

        {/* Today's orders + Pending restaurants */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel className="lg:col-span-2" title="Today's orders" action={{ label: 'All orders', to: 'SuperAdminOrders' }}>
            {todayOrders.length === 0 ? (
              <Empty text="No orders yet today" />
            ) : (
              <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto -mx-5">
                {todayOrders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-full f-tint-gold flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-[18px] h-[18px] f-text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{order.restaurant_name}</p>
                      <p className="text-[12px] text-gray-500 truncate">
                        {order.customer_name} · {new Date(order.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-semibold text-gray-900">{naira(order.total)}</p>
                      <div className="flex gap-1 justify-end mt-1">
                        <Pill status={order.status} />
                        <Pill status={order.payment_status === 'paid' ? 'paid' : 'unpaid'} label={order.payment_status || 'unpaid'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Awaiting approval" action={{ label: 'Review', to: 'SuperAdminRestaurants' }}>
            {pendingRestaurants.length === 0 ? (
              <Empty text="No restaurants waiting" />
            ) : (
              <div className="space-y-1 -mx-2">
                {pendingRestaurants.slice(0, 6).map(r => (
                  <Link key={r.id} to={createPageUrl('SuperAdminRestaurants')} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <Avatar src={r.logo_url} icon={Store} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">{r.name}</p>
                      <p className="text-[12px] text-gray-500 truncate">{r.city || '—'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Top restaurants + Riders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Top restaurants by revenue">
            {restaurantRevenue.length === 0 ? (
              <Empty text="No revenue data yet" />
            ) : (
              <div className="space-y-4">
                {restaurantRevenue.slice(0, 8).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="w-5 text-[12px] font-semibold text-gray-400 text-center">{i + 1}</span>
                    <Avatar src={r.logo_url} icon={Store} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[14px] font-medium text-gray-900 truncate">{r.name}</p>
                        <p className="text-[14px] font-semibold text-gray-900 flex-shrink-0">{naira(r.revenue)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-fooda-gold" style={{ width: `${topRevenue ? (r.revenue / topRevenue) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-500 w-16 text-right">{r.orderCount} orders</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Rider earnings" action={{ label: 'Riders', to: 'SuperAdminRiders' }}>
            {riderEarnings.length === 0 ? (
              <Empty text="No rider data yet" />
            ) : (
              <div className="divide-y divide-gray-100 -mx-5 max-h-[420px] overflow-y-auto">
                {riderEarnings.map(rider => (
                  <div key={rider.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[13px] font-semibold text-gray-700">
                        {(rider.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${rider.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">{rider.full_name}</p>
                      <p className="text-[12px] text-gray-500">
                        {rider.deliveryCount} deliveries · {naira(rider.deliveryCount ? rider.earnings / rider.deliveryCount : 0)}/trip
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-gray-900">{naira(rider.earnings)}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Refunds */}
        <Panel title="Cancelled orders awaiting refund" action={{ label: 'All cancelled', to: 'SuperAdminCancelledOrders' }}>
          {unrefunded.length === 0 ? (
            <Empty text="Nothing to refund — you're all caught up" />
          ) : (
            <div className="divide-y divide-gray-100 -mx-5">
              {unrefunded.slice(0, 8).map(order => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-10 h-10 rounded-full f-tint-red flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-[18px] h-[18px] f-text-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{order.restaurant_name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{order.customer_name} · {new Date(order.created_date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-[14px] font-semibold text-gray-900 hidden sm:block">{naira(order.total)}</p>
                  <button
                    type="button"
                    onClick={() => markRefundedMutation.mutate(order.id)}
                    disabled={markRefundedMutation.isPending && markRefundedMutation.variables === order.id}
                    className="h-9 px-4 rounded-xl text-[13px] font-semibold f-btn-gold press disabled:opacity-60"
                  >
                    Mark refunded
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, to, highlight, warn }) {
  const body = (
    <div className={`h-full rounded-2xl bg-white border p-4 md:p-5 transition-shadow ${to ? 'hover:shadow-[0_6px_20px_-6px_rgba(17,17,17,0.12)]' : ''} ${highlight ? 'f-border-gold' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${warn ? 'f-tint-red' : 'f-tint-gold'}`}>
          <Icon className={`w-5 h-5 ${warn ? 'f-text-red' : 'f-text-gold'}`} />
        </div>
        {to && <ChevronRight className="w-4 h-4 text-gray-300" />}
      </div>
      <p className="text-[22px] md:text-[26px] leading-tight font-bold tracking-tight text-gray-900 truncate">{value}</p>
      <p className="text-[13px] font-medium text-gray-700 mt-1">{label}</p>
      {sub && <p className={`text-[12px] mt-0.5 ${highlight ? 'f-text-amber font-medium' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  );
  return to ? <Link to={createPageUrl(to)} className="block">{body}</Link> : body;
}

function Panel({ title, action, className = '', children }) {
  return (
    <section className={`rounded-2xl bg-white border border-gray-100 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        {action && (
          <Link to={createPageUrl(action.to)} className="text-[13px] font-medium f-text-amber hover:underline flex items-center gap-0.5">
            {action.label} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Pill({ status, label }) {
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full border text-[11px] font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {label || status}
    </span>
  );
}

function Avatar({ src, icon: Icon }) {
  return src ? (
    <img src={src} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
  ) : (
    <div className="w-10 h-10 rounded-xl f-tint-gold flex items-center justify-center flex-shrink-0">
      <Icon className="w-[18px] h-[18px] f-text-gold" />
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-center text-[13px] text-gray-500 py-8">{text}</p>;
}
