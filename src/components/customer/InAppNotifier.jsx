import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { styleFor, linkFor } from '@/lib/notificationStyles';

/**
 * In-app notification banner for customers.
 * Checks for new notifications every 15 seconds and slides each one down from the
 * top of the screen, one at a time. Tapping opens the related order or restaurant
 * and marks it read; swiping up or ✕ dismisses it (it stays unread in Notifications).
 */

const POLL_MS = 15000;
const SHOW_MS = 6000;
const APP_ICON = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/2f8e2d4ee_Gemini_Generated_Image_afhnisafhnisafhn-removebg-preview.png';

const shownKey = (email) => `inapp_shown_${email}`;
const loadShown = (email) => {
  try { return JSON.parse(localStorage.getItem(shownKey(email)) || 'null'); } catch { return null; }
};
const saveShown = (email, ids) => {
  try { localStorage.setItem(shownKey(email), JSON.stringify(ids.slice(-200))); } catch {}
};

export default function InAppNotifier({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState([]);
  const current = queue[0];
  const timer = useRef(null);

  const email = user?.email;

  // Poll for new notifications.
  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    const check = async () => {
      try {
        const unread = await base44.entities.Notification.filter({ user_email: email, is_read: false }, '-created_date', 10);
        if (cancelled) return;

        let shown = loadShown(email);
        if (shown === null) {
          // First run on this device: don't flood with old notifications — only very recent ones.
          const recentCutoff = Date.now() - 2 * 60 * 1000;
          shown = unread.filter(n => new Date(n.created_date).getTime() < recentCutoff).map(n => n.id);
          saveShown(email, shown);
        }

        const fresh = unread.filter(n => !shown.includes(n.id)).reverse(); // oldest first
        if (fresh.length) {
          saveShown(email, [...shown, ...fresh.map(n => n.id)]);
          setQueue(q => [...q, ...fresh.filter(f => !q.some(x => x.id === f.id))]);
          queryClient.invalidateQueries({ queryKey: ['notifications'] }); // bell badge

          // If the app is in the background, also show a system notification (when allowed).
          if (document.hidden && 'Notification' in window && window.Notification.permission === 'granted') {
            fresh.forEach(n => {
              try { new window.Notification(n.title, { body: n.message, icon: APP_ICON, tag: n.id }); } catch {}
            });
          }
        }
      } catch { /* offline or logged out — try again next tick */ }
    };

    check();
    const interval = setInterval(check, POLL_MS);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [email, queryClient]);

  const dismiss = useCallback(() => setQueue(q => q.slice(1)), []);

  // Auto-hide each banner.
  useEffect(() => {
    if (!current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(dismiss, SHOW_MS);
    return () => clearTimeout(timer.current);
  }, [current, dismiss]);

  const open = async () => {
    if (!current) return;
    const n = current;
    dismiss();
    try {
      await base44.entities.Notification.update(n.id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    } catch {}
    const link = linkFor(n);
    if (link) navigate(createPageUrl(link));
  };

  const style = current ? styleFor(current.type) : null;
  const Icon = style?.Icon;
  const image = current?.metadata?.image_url;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y < -30) dismiss(); }}
            className="pointer-events-auto max-w-lg mx-auto"
            role="status"
            aria-live="polite"
          >
            <div className="relative flex items-start gap-3 rounded-2xl bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-3 pr-9">
              <button type="button" onClick={open} className="flex items-start gap-3 text-left flex-1 min-w-0">
                {image ? (
                  <img src={image} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${style.tint}`}>
                    <Icon className={`w-5 h-5 ${style.icon}`} strokeWidth={2.4} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 leading-snug">{current.title}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{current.message}</p>
                  {linkFor(current) && (
                    <p className="text-[11px] font-bold uppercase tracking-wide f-text-green mt-1">
                      {current.type === 'restaurant_open' ? 'Order now' : 'View order'}
                    </p>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss notification"
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              {/* time-left bar */}
              <motion.div
                key={`bar-${current.id}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: SHOW_MS / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-fooda-gold/70"
              />
            </div>
            {queue.length > 1 && (
              <p className="text-center text-[11px] text-gray-500 mt-1">+{queue.length - 1} more</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
