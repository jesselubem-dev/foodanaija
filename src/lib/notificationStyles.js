// One place that decides how each notification type looks (icon + colours),
// shared by the in-app banner and the Notifications page.
import { Check, X, PackageCheck, Bell, Bike, ShoppingBag, Store, CircleSlash, Tag } from 'lucide-react';

export const NOTIFICATION_STYLES = {
  order_placed:     { Icon: ShoppingBag, tint: 'f-tint-gold',  icon: 'f-text-amber' },
  order_accepted:   { Icon: Check,       tint: 'f-tint-green', icon: 'f-text-green' },
  rider_assigned:   { Icon: Bike,        tint: 'f-tint-gold',  icon: 'f-text-amber' },
  order_picked_up:  { Icon: Bike,        tint: 'f-tint-gold',  icon: 'f-text-amber' },
  order_on_the_way: { Icon: Bike,        tint: 'f-tint-green', icon: 'f-text-green' },
  order_delivered:  { Icon: PackageCheck,tint: 'f-tint-green', icon: 'f-text-green' },
  order_declined:   { Icon: X,           tint: 'f-tint-red',   icon: 'f-text-red' },
  order_cancelled:  { Icon: CircleSlash, tint: 'f-tint-red',   icon: 'f-text-red' },
  restaurant_open:  { Icon: Store,       tint: 'f-tint-gold',  icon: 'f-text-amber' },
  promo:            { Icon: Tag,         tint: 'f-tint-gold',  icon: 'f-text-amber' },
};

export const DEFAULT_NOTIFICATION_STYLE = { Icon: Bell, tint: 'f-tint-gold', icon: 'f-text-amber' };

export const styleFor = (type) => NOTIFICATION_STYLES[type] || DEFAULT_NOTIFICATION_STYLE;

// Where tapping a notification should go (older records have no link).
export const linkFor = (n) => n.link || (n.order_id ? 'OrderHistory' : null);
