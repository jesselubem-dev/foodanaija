import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, ChevronRight, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EASE_NATIVE } from '@/components/ui/motion';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { EmptyState } from '../fooda/ui';

// Slide-in order summary used on the restaurant page ("View order").
export default function FloatingCart({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem }) {
  const { settings, calculateTotalVAS } = usePlatformSettings();

  // Same fee rules as the Cart and Checkout pages.
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const restaurantCount = new Set(cart.map(i => i.restaurant_id)).size;
  const deliveryFee = restaurantCount * settings.delivery_fee;
  const serviceFee = cart.length ? calculateTotalVAS(cart) : 0;
  const total = subtotal + deliveryFee + serviceFee;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
        <SheetHeader className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 border-b border-gray-100 text-left">
          <SheetTitle className="text-[17px] font-semibold text-gray-900">
            Your order {itemCount > 0 && <span className="text-gray-500 font-normal">· {itemCount} item{itemCount === 1 ? '' : 's'}</span>}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={ShoppingCart}
              title="Your order is empty"
              message="Add dishes from the menu to get started."
              actionLabel="Browse menu"
              onAction={onClose}
              className="py-0"
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    key={item.item_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.22, ease: EASE_NATIVE } }}
                    transition={{ duration: 0.28, ease: EASE_NATIVE }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-200 bg-white"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl f-tint-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[12px] font-medium f-text-green mt-0.5">₦{Number(item.price || 0).toLocaleString()} each</p>
                      <button
                        onClick={() => onRemoveItem(item.item_id)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-full px-1.5 py-1 bg-fooda-gold flex-shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.item_id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        aria-label={`One less ${item.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center f-bg-ink disabled:opacity-40 press"
                      >
                        <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="text-[13px] font-semibold w-4 text-center f-on-gold"
                      >
                        {item.quantity}
                      </motion.span>
                      <button
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                        aria-label={`One more ${item.name}`}
                        className="w-7 h-7 rounded-full flex items-center justify-center f-bg-ink press"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 bg-white">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery{restaurantCount > 1 ? ` (${restaurantCount} restaurants)` : ''}</span>
                  <span className="text-gray-900">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service charge</span>
                  <span className="text-gray-900">₦{serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1.5 text-[15px]">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">₦{total.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to={createPageUrl('Checkout')}
                onClick={onClose}
                className="h-14 rounded-2xl flex items-center justify-center gap-1 text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
              >
                Checkout · ₦{total.toLocaleString()} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
