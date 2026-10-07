import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Bike, ReceiptText, MapPin, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import CancelOrderModal from '../components/customer/CancelOrderModal';
import { LanguageProvider } from '../components/LanguageContext';
import ErrorBoundary from '../components/ErrorBoundary';
import BottomNav from '../components/customer/BottomNav';
import { ChipGroup } from '../components/fooda/ui';

// Status pill colours, in the Fooda palette.
const STATUS = {
  pending:   { label: 'Pending',   bg: '#FEF3C7', fg: '#92400E' },
  accepted:  { label: 'Accepted',  bg: '#ECFDF3', fg: '#15803D' },
  on_way:    { label: 'On the way', bg: '#ECFDF3', fg: '#15803D' },
  delivered: { label: 'Delivered', bg: '#F3F4F6', fg: '#374151' },
  declined:  { label: 'Declined',  bg: '#FEF2F2', fg: '#B91C1C' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', fg: '#B91C1C' },
  refunded:  { label: 'Refunded',  bg: '#EFF6FF', fg: '#1D4ED8' },
  unpaid:    { label: 'Not paid',  bg: '#F3F4F6', fg: '#6B7280' },
};

// A checkout that was saved but never paid (payment never confirmed).
const isUnpaid = (order) => order.status === 'pending' && order.payment_status === 'initiated';

// One place that decides how an order is shown.
function describe(order) {
  const ds = order.delivery_status;
  if (order.status === 'cancelled') return { key: order.refunded ? 'refunded' : 'cancelled', active: false };
  if (order.status === 'declined') return { key: 'declined', active: false };
  if (isUnpaid(order)) return { key: 'unpaid', active: false };
  if (order.status === 'delivered' || ds === 'delivered') return { key: 'delivered', active: false };
  if (order.status === 'accepted' && (ds === 'picked_up' || ds === 'on_the_way')) return { key: 'on_way', active: true };
  if (order.status === 'accepted') return { key: 'accepted', active: true };
  return { key: 'pending', active: true };
}

// 0 placed, 1 accepted, 2 rider has it, 3 delivered
function stepIndex(order) {
  const ds = order.delivery_status;
  if (order.status === 'delivered' || ds === 'delivered') return 3;
  if (ds === 'picked_up' || ds === 'on_the_way') return 2;
  if (order.status === 'accepted') return 1;
  return 0;
}

const STEPS = ['Placed', 'Accepted', 'On the way', 'Delivered'];

function Tracker({ order }) {
  const current = stepIndex(order);
  const riderNote = {
    unassigned: 'Finding a rider for you',
    assigned: 'Rider assigned — heading to the restaurant',
    picked_up: 'Rider has picked up your food',
    on_the_way: 'Your food is on the way',
  }[order.delivery_status];

  return (
    <div className="mt-3 rounded-xl p-3 f-tint-gold">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const done = i <= current;
          return (
            <React.Fragment key={label}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: done ? '#F5B700' : '#E5E7EB' }}
              >
                {i === 2 && current === 2
                  ? <Bike className="w-3.5 h-3.5 f-on-gold" />
                  : done
                    ? <Check className="w-3.5 h-3.5 f-on-gold" strokeWidth={3} />
                    : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[3px] mx-1 rounded-full" style={{ backgroundColor: i < current ? '#F5B700' : '#E5E7EB' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-medium ${i <= current ? 'text-gray-900' : 'text-gray-400'}`}
            style={{ width: '25%', textAlign: i === 0 ? 'left' : i === STEPS.length - 1 ? 'right' : 'center' }}
          >
            {label}
          </span>
        ))}
      </div>
      {(riderNote || order.rider_name) && order.status === 'accepted' && (
        <p className="text-[12px] mt-2 f-text-soft">
          {riderNote}{order.rider_name ? ` · ${order.rider_name}` : ''}
        </p>
      )}
    </div>
  );
}

function OrderHistoryContent() {
  const [user, setUser] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [tab, setTab] = useState('active');
  const [expanded, setExpanded] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const response = await base44.functions.invoke('getMyOrders', {});
      return response.data?.orders || [];
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      await base44.entities.Order.update(orderId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders', user?.email] });
      toast.success('Order cancelled successfully. You will receive a refund within 2 hours.', {
        duration: 5000,
      });
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  const handleReorder = (order) => {
    const cart = (order.items || []).map(item => ({
      item_id: item.item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      restaurant_id: order.restaurant_id,
      restaurant_name: order.restaurant_name
    }));

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`${cart.length} item${cart.length === 1 ? '' : 's'} added to your order`);
    window.location.href = createPageUrl('Cart');
  };

  const { active, past } = useMemo(() => {
    const a = [], p = [];
    orders.forEach(o => (describe(o).active ? a : p).push(o));
    return { active: a, past: p };
  }, [orders]);

  // Open on "Past" when there's nothing in progress.
  useEffect(() => {
    if (!isLoading && orders.length > 0 && active.length === 0) setTab('past');
  }, [isLoading, orders.length, active.length]);

  const list = tab === 'active' ? active : past;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white pb-28">
        {/* Header */}
        <div className="bg-white px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-2 sticky top-0 z-30">
          <div className="max-w-lg mx-auto">
            <h1 className="text-[20px] font-semibold text-gray-900">Your orders</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Track what's on the way and reorder favourites</p>

            {/* Tabs */}
            <ChipGroup
              className="mt-4"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'active', label: `Active${active.length ? ` (${active.length})` : ''}` },
                { id: 'past', label: 'Past orders' },
              ]}
            />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-2xl border border-gray-100 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-3/4 mt-3" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 f-tint-gold">
                <ReceiptText className="w-9 h-9 f-text-gold" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {tab === 'active' ? 'No active orders' : 'No past orders yet'}
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-[260px]">
                {tab === 'active'
                  ? "When you place an order, you can track it right here."
                  : 'Orders you complete will show up here so you can reorder in one tap.'}
              </p>
              <Link
                to={createPageUrl('CustomerHome')}
                className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center press f-btn-gold"
              >
                Browse restaurants
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map(order => {
                const d = describe(order);
                const pill = STATUS[d.key];
                const items = order.items || [];
                const thumb = items.find(i => i.image_url)?.image_url;
                const itemCount = items.reduce((s, i) => s + (i.quantity || 0), 0);
                const isOpen = !!expanded[order.id];
                const summary = items.map(i => `${i.quantity}× ${i.name}`).join(', ');

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-3 bg-white ${d.active ? 'border-fooda-gold/40' : 'border-gray-200'}`}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🍽️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[15px] font-semibold text-gray-900 leading-tight truncate">{order.restaurant_name}</h3>
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: pill.bg, color: pill.fg }}
                          >
                            {pill.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {moment(order.created_date).format('D MMM YYYY · h:mm A')} · {itemCount} item{itemCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <button
                      type="button"
                      onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))}
                      className="w-full text-left mt-2.5 flex items-start gap-1"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <div className="flex-1 space-y-1">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[13px]">
                              <span className="text-gray-700">{item.quantity}× {item.name}</span>
                              <span className="text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          {order.delivery_address && (
                            <p className="flex items-start gap-1 text-[12px] text-gray-500 pt-1.5">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {order.delivery_address}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="flex-1 text-[13px] text-gray-700 truncate">{summary}</p>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Live tracker for orders in progress */}
                    {d.active && d.key !== 'pending' && <Tracker order={order} />}
                    {d.key === 'unpaid' && (
                      <p className="mt-3 text-[12px] rounded-xl px-3 py-2 f-tint-gray f-text-muted">
                        Payment wasn't completed for this order. Tap Reorder to try again.
                      </p>
                    )}
                    {d.key === 'pending' && (
                      <p className="mt-3 text-[12px] rounded-xl px-3 py-2 f-tint-gold f-text-amber">
                        Waiting for {order.restaurant_name} to accept your order
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[11px] text-gray-500">Total</p>
                        <p className="text-[16px] font-bold text-gray-900">₦{Number(order.total || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {d.key === 'pending' && (
                          <button
                            onClick={() => setCancelOrderId(order.id)}
                            disabled={cancelOrderMutation.isPending}
                            className="h-9 px-3.5 rounded-lg text-[12px] font-semibold border disabled:opacity-50 press f-btn-outline-danger"
                          >
                            Cancel
                          </button>
                        )}
                        {!d.active && items.length > 0 && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="h-9 px-4 rounded-lg text-[12px] font-semibold uppercase tracking-wide press f-btn-gold"
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav user={user} />

        {/* Cancel Order Modal */}
        <CancelOrderModal
          isOpen={!!cancelOrderId}
          order={orders.find(o => o.id === cancelOrderId)}
          onConfirm={(orderId) => {
            cancelOrderMutation.mutate(orderId);
            setCancelOrderId(null);
          }}
          onCancel={() => setCancelOrderId(null)}
          isLoading={cancelOrderMutation.isPending}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function OrderHistory() {
  return (
    <LanguageProvider>
      <OrderHistoryContent />
    </LanguageProvider>
  );
}
