import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, PackageCheck, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { LanguageProvider } from '../components/LanguageContext';
import { ChipGroup, PageHeader } from '../components/fooda/ui';

// Visual style per notification type, matching the Fooda palette.
const TYPE_STYLE = {
  order_accepted: { Icon: Check, bg: '#ECFDF3', fg: '#15803D', label: 'Order update' },
  order_declined: { Icon: X, bg: '#FEF2F2', fg: '#DC2626', label: 'Order update' },
  order_delivered: { Icon: PackageCheck, bg: '#FFFBEB', fg: '#B45309', label: 'Delivered' },
};
const DEFAULT_STYLE = { Icon: Bell, bg: '#FFFBEB', fg: '#B45309', label: 'Notification' };

const timeLabel = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  if (Date.now() - d.getTime() < 60 * 1000) return 'Just now';
  if (isToday(d)) return formatDistanceToNowStrict(d, { addSuffix: true });
  if (isYesterday(d)) return format(d, 'h:mm a');
  return format(d, 'd MMM, h:mm a');
};

const groupLabel = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return 'Earlier';
};

function NotificationsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] }); // bell badge
  };

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => { refresh(); toast.success('All caught up'); },
    onError: () => toast.error('Could not update notifications. Try again.'),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const groups = useMemo(() => {
    const order = ['Today', 'Yesterday', 'Earlier'];
    const map = {};
    visible.forEach(n => {
      const g = groupLabel(n.created_date);
      (map[g] = map[g] || []).push(n);
    });
    return order.filter(g => map[g]).map(g => ({ title: g, items: map[g] }));
  }, [visible]);

  const openNotification = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.order_id) navigate(createPageUrl('OrderHistory'));
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('CustomerHome'));
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <PageHeader
        title="Notifications"
        right={unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-[12px] font-semibold f-text-green disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      />

      <div className="max-w-lg mx-auto px-4">
        {/* Filter chips */}
        <ChipGroup
          className="mt-2 mb-4"
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadCount ? `Unread (${unreadCount})` : 'Unread' },
          ]}
        />

        {isLoading || !user ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-2xl border border-gray-100 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 f-tint-gold">
              <Bell className="w-9 h-9 f-text-gold" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-[260px]">
              {filter === 'unread'
                ? 'New updates about your orders will show up here.'
                : "We'll let you know when a restaurant accepts your order or it's delivered."}
            </p>
            <Link
              to={createPageUrl('CustomerHome')}
              className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center press f-btn-gold"
            >
              Browse restaurants
            </Link>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.title} className="mb-5">
              <h2 className="text-[13px] font-semibold text-gray-500 mb-2">{group.title}</h2>
              <div className="space-y-2.5">
                {group.items.map(n => {
                  const style = TYPE_STYLE[n.type] || DEFAULT_STYLE;
                  const { Icon } = style;
                  const image = n.metadata?.image_url;
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border press-card ${
                        n.is_read ? 'border-gray-200 bg-white' : 'border-fooda-gold/40 f-tint-cream'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {image ? (
                          <img src={image} alt="" className="w-11 h-11 rounded-xl object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                            <Icon className="w-5 h-5" style={{ color: style.fg }} strokeWidth={2.4} />
                          </div>
                        )}
                        {!n.is_read && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-fooda-red"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[14px] leading-snug text-gray-900 ${n.is_read ? 'font-medium' : 'font-semibold'}`}>
                            {n.title}
                          </p>
                          <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">{timeLabel(n.created_date)}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        {n.order_id && (
                          <span className="inline-flex items-center gap-0.5 mt-1.5 text-[11px] font-bold uppercase tracking-wide f-text-green">
                            View order <ChevronRight className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  return (
    <LanguageProvider>
      <NotificationsContent />
    </LanguageProvider>
  );
}
