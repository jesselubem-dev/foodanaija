import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Search, Download, Wallet, CalendarDays, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChipGroup } from '@/components/fooda/ui';

const naira = (n) => `₦${Math.round(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '');
// Older refunds may have no refunded_at; fall back to when the order was last updated
const refundDate = (o) => o.refunded_at || o.updated_date || o.created_date;

const RANGES = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
];

export default function SuperAdminRefundedOrders() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u.role !== 'admin' && u._app_role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(u);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    })();
  }, []);

  // Shares the same cache as the other admin pages, so an order shows up
  // here the instant it's marked refunded anywhere else.
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const undoMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { refunded: false, refunded_at: null, refunded_by: null }),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ['all-orders'] });
      const previous = queryClient.getQueryData(['all-orders']);
      queryClient.setQueryData(['all-orders'], (old) =>
        Array.isArray(old) ? old.map(o => (o.id === orderId ? { ...o, refunded: false } : o)) : old
      );
      return { previous };
    },
    onSuccess: () => toast.success('Moved back to Cancelled Orders'),
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['all-orders'], ctx.previous);
      toast.error(`Couldn't undo: ${err?.message || 'please try again'}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
  });

  const refunded = orders
    .filter(o => o.refunded)
    .sort((a, b) => new Date(refundDate(b)) - new Date(refundDate(a)));

  const now = new Date();
  const inRange = (o) => {
    const d = new Date(refundDate(o));
    if (range === 'today') return d.toDateString() === now.toDateString();
    if (range === '7d') return now - d <= 7 * 864e5;
    if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  };
  const q = search.trim().toLowerCase();
  const visible = refunded.filter(o =>
    inRange(o) &&
    (!q || [o.restaurant_name, o.customer_name, o.customer_email, o.customer_phone, o.id, o.payment_reference]
      .some(v => v?.toLowerCase().includes(q)))
  );

  const totalAll = refunded.reduce((s, o) => s + (o.total || 0), 0);
  const thisMonth = refunded.filter(o => {
    const d = new Date(refundDate(o));
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const visibleTotal = visible.reduce((s, o) => s + (o.total || 0), 0);

  const exportCsv = () => {
    const header = ['Order ID', 'Restaurant', 'Customer', 'Email', 'Phone', 'Amount', 'Payment method', 'Payment reference', 'Order date', 'Refunded on', 'Refunded by'];
    const rows = visible.map(o => [
      o.id, o.restaurant_name, o.customer_name, o.customer_email, o.customer_phone, o.total,
      o.payment_method, o.payment_reference, fmtDate(o.created_date), fmtDate(refundDate(o)), o.refunded_by,
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fooda-refunded-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refunded Orders</h1>
            <p className="text-gray-500 mt-1">Every order you've marked as refunded, newest first.</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold f-btn-outline flex items-center gap-2 press disabled:opacity-50 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat icon={RotateCcw} label="Orders refunded" value={refunded.length} />
          <Stat icon={Wallet} label="Total refunded" value={naira(totalAll)} />
          <Stat icon={CalendarDays} label="Refunded this month" value={naira(thisMonth.reduce((s, o) => s + (o.total || 0), 0))} sub={`${thisMonth.length} orders`} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, restaurant, phone, order ID or payment ref"
              className="chat-input w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-fooda-gold"
            />
          </div>
          <ChipGroup options={RANGES} value={range} onChange={setRange} />
        </div>

        {/* List */}
        <section className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-gray-900">{visible.length} {visible.length === 1 ? 'order' : 'orders'}</p>
            <p className="text-[13px] text-gray-500">Total <span className="font-semibold text-gray-900">{naira(visibleTotal)}</span></p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin w-7 h-7 border-2 border-fooda-gold border-t-transparent rounded-full" />
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full f-tint-gold flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-7 h-7 f-text-gold" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">
                {refunded.length === 0 ? 'No refunds yet' : 'No refunds match your filters'}
              </p>
              <p className="text-[13px] text-gray-500 mt-1">
                {refunded.length === 0 ? 'Orders you mark as refunded in Cancelled Orders will appear here.' : 'Try another date range or search.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visible.map(o => (
                <div key={o.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full f-tint-green flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-[18px] h-[18px] f-text-green" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{o.customer_name || o.customer_email}</p>
                        <span className="inline-flex items-center h-5 px-2 rounded-full border text-[11px] font-semibold bg-green-50 text-green-700 border-green-200">Refunded</span>
                      </div>
                      <p className="text-[12px] text-gray-500 truncate mt-0.5">
                        {o.restaurant_name} · #{o.id.slice(0, 8)} · ordered {fmtDate(o.created_date)}
                      </p>
                      <p className="text-[12px] text-gray-500 truncate">
                        {o.customer_phone || o.customer_email}
                        {o.payment_method ? ` · ${o.payment_method.toUpperCase()}` : ''}
                        {o.payment_reference ? ` · Ref ${o.payment_reference}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pl-[52px] md:pl-0">
                    <div className="md:text-right">
                      <p className="text-[15px] font-bold text-gray-900">{naira(o.total)}</p>
                      <p className="text-[11px] text-gray-500">
                        Refunded {fmtDate(refundDate(o))} {o.refunded_at ? fmtTime(o.refunded_at) : ''}
                      </p>
                      {o.refunded_by && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">by {o.refunded_by}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Mark this order as NOT refunded? It will move back to Cancelled Orders.')) undoMutation.mutate(o.id);
                      }}
                      disabled={undoMutation.isPending && undoMutation.variables === o.id}
                      className="h-9 px-3 rounded-xl text-[12px] font-semibold f-btn-outline flex items-center gap-1.5 press disabled:opacity-50"
                      title="Undo refund"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl f-tint-green flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 f-text-green" />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] leading-tight font-bold tracking-tight text-gray-900 truncate">{value}</p>
        <p className="text-[13px] text-gray-500">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
    </div>
  );
}
