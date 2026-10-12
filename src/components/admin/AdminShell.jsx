// Shared frame for every Super Admin page: sidebar on desktop, top bar +
// slide-in drawer on mobile. Styled with the Foodanaija customer-app palette
// (white surfaces, gold accents, ink text) so admin and app feel like one product.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { countUnreadChats } from '@/lib/chatUnread';
import {
  LayoutDashboard, BarChart3, ShoppingBag, XCircle, CupSoda, Store, Bike,
  AlertTriangle, ChefHat, Users, Headset, MessageCircle, LifeBuoy, Tag,
  UtensilsCrossed, Sparkles, Ticket, Share2, Megaphone, Settings, Menu, X, LogOut, RotateCcw,
} from 'lucide-react';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png';

export const ADMIN_PAGES = [
  'SuperAdminDashboard', 'SuperAdminReports', 'SuperAdminOrders', 'SuperAdminCancelledOrders', 'SuperAdminRefundedOrders',
  'SuperAdminDrinkOrders', 'SuperAdminRestaurants', 'SuperAdminRiders', 'SuperAdminRiderComplaints',
  'SuperAdminChefs', 'SuperAdminUsers', 'AdminLiveChat', 'SuperAdminMessages', 'SuperAdminSupport',
  'SuperAdminAllMenus', 'SuperAdminDrinks', 'SuperAdminPromoBanners', 'SuperAdminPromoCode',
  'SuperAdminMenuMarketing', 'SuperAdminBroadcast', 'SuperAdminFeeSettings',
];

const NAV = [
  { group: 'Overview', items: [
    { to: 'SuperAdminDashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'SuperAdminReports', icon: BarChart3, label: 'Reports' },
  ]},
  { group: 'Operations', items: [
    { to: 'SuperAdminOrders', icon: ShoppingBag, label: 'Orders', badge: 'pendingOrders' },
    { to: 'SuperAdminCancelledOrders', icon: XCircle, label: 'Cancelled Orders', badge: 'unrefunded' },
    { to: 'SuperAdminRefundedOrders', icon: RotateCcw, label: 'Refunded Orders' },
    { to: 'SuperAdminDrinkOrders', icon: CupSoda, label: 'Drink Orders', badge: 'pendingDrinks' },
    { to: 'SuperAdminRestaurants', icon: Store, label: 'Restaurants', badge: 'pendingRestaurants' },
    { to: 'SuperAdminRiders', icon: Bike, label: 'Riders' },
    { to: 'SuperAdminRiderComplaints', icon: AlertTriangle, label: 'Rider Complaints' },
    { to: 'SuperAdminChefs', icon: ChefHat, label: 'Chefs' },
  ]},
  { group: 'Customers', items: [
    { to: 'SuperAdminUsers', icon: Users, label: 'Users' },
    { to: 'AdminLiveChat', icon: Headset, label: 'Live Chat', badge: 'unreadChats' },
    { to: 'SuperAdminMessages', icon: MessageCircle, label: 'Messages' },
    { to: 'SuperAdminSupport', icon: LifeBuoy, label: 'Support Tickets' },
  ]},
  { group: 'Catalogue', items: [
    { to: 'SuperAdminAllMenus', icon: Tag, label: 'Menus & Prices' },
    { to: 'SuperAdminDrinks', icon: UtensilsCrossed, label: 'Drinks' },
  ]},
  { group: 'Marketing', items: [
    { to: 'SuperAdminPromoBanners', icon: Sparkles, label: 'Promo Banners' },
    { to: 'SuperAdminPromoCode', icon: Ticket, label: 'Promo Codes' },
    { to: 'SuperAdminMenuMarketing', icon: Share2, label: 'Marketing Links' },
    { to: 'SuperAdminBroadcast', icon: Megaphone, label: 'Broadcast' },
  ]},
  { group: 'Settings', items: [
    { to: 'SuperAdminFeeSettings', icon: Settings, label: 'Fee Settings' },
  ]},
];

const ALL_ITEMS = NAV.flatMap(g => g.items);

function useBadgeCounts(enabled) {
  const opts = { enabled, refetchInterval: 15000 };
  const { data: restaurants = [] } = useQuery({ queryKey: ['all-restaurants'], queryFn: () => base44.entities.Restaurant.list(), ...opts });
  const { data: orders = [] } = useQuery({ queryKey: ['all-orders'], queryFn: () => base44.entities.Order.list(), ...opts });
  const { data: drinkOrders = [] } = useQuery({ queryKey: ['all-drink-orders'], queryFn: () => base44.entities.DrinkOrder.list(), ...opts });
  const { data: chats = [] } = useQuery({ queryKey: ['all-chat-messages'], queryFn: () => base44.entities.ChatMessage.list('-created_date'), ...opts });

  return {
    pendingRestaurants: restaurants.filter(r => !r.is_approved).length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    unrefunded: orders.filter(o => o.status === 'cancelled' && !o.refunded).length,
    pendingDrinks: drinkOrders.filter(o => o.status === 'pending').length,
    unreadChats: countUnreadChats(chats),
  };
}

export default function AdminShell({ currentPageName, user, children }) {
  const [open, setOpen] = useState(false);
  const isAdmin = !!user && (user.role === 'admin' || user._app_role === 'admin');
  const counts = useBadgeCounts(isAdmin);
  const current = ALL_ITEMS.find(i => i.to === currentPageName);

  useEffect(() => { setOpen(false); }, [currentPageName]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const nav = (
    <nav className="px-3 pb-6 space-y-5">
      {NAV.map(section => (
        <div key={section.group}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{section.group}</p>
          <div className="space-y-0.5">
            {section.items.map(item => (
              <NavItem key={item.to} item={item} active={item.to === currentPageName} count={item.badge ? counts[item.badge] : 0} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const profile = (
    <div className="border-t border-gray-100 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <div className="w-9 h-9 rounded-full bg-fooda-green text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.full_name || 'Administrator'}</p>
          <p className="text-[12px] text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => base44.auth.logout()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const brand = (
    <Link to={createPageUrl('SuperAdminDashboard')} className="flex items-center gap-2.5">
      <img src={LOGO} alt="Fooda Naija" className="h-9 w-auto object-contain" />
      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-fooda-green text-white">Admin</span>
    </Link>
  );

  return (
    <div className="min-h-screen fooda-admin-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-gray-100 z-40">
        <div className="h-16 px-5 flex items-center border-b border-gray-100">{brand}</div>
        <div className="flex-1 overflow-y-auto pt-4 scrollbar-hide">{nav}</div>
        {profile}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 pt-[var(--sat)]">
        <div className="h-14 px-4 flex items-center justify-between">
          {brand}
          <div className="flex items-center gap-2">
            {current && <span className="text-[13px] font-medium text-gray-500 hidden sm:block">{current.label}</span>}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center press"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-native-fade" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-white flex flex-col shadow-2xl pt-[var(--sat)]" style={{ animation: 'admin-drawer-in .28s cubic-bezier(.32,.72,0,1) both' }}>
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100" aria-label="Close menu">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">{nav}</div>
            {profile}
          </div>
        </div>
      )}

      <main className="fooda-admin lg:pl-64 pt-[calc(3.5rem+var(--sat))] lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavItem({ item, active, count }) {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(item.to)}
      className={`group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] transition-colors ${
        active ? 'f-tint-gold text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
      }`}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-fooda-gold" />}
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'f-text-gold' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-fooda-red text-white text-[11px] font-semibold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
