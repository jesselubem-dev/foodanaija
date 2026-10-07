import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';

// Bell icon with unread badge — opens the full Notifications page.
export default function NotificationBell({ userEmail }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, is_read: false }, '-created_date', 20),
    enabled: !!userEmail,
    refetchInterval: 20000,
    staleTime: 15000,
  });

  const unreadCount = notifications.length;

  return (
    <Link
      to={createPageUrl('Notifications')}
      aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-50 press"
    >
      <Bell className="w-[22px] h-[22px]" strokeWidth={1.9} />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-fooda-red text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
