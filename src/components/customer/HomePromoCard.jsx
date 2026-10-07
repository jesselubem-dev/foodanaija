import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

// Picks the best currently-usable public promo code, using the same
// validity rules as Checkout, so the banner never advertises a code
// that checkout would reject.
function isUsable(code, now) {
  if (!code?.is_active || !code.code) return false;
  if (code.is_personalised || code.assigned_user_email) return false;
  if (code.valid_until && new Date(code.valid_until) < now) return false;
  if (code.valid_from && new Date(code.valid_from) > now) return false;
  if (code.max_usage > 0 && (code.current_usage || 0) >= code.max_usage) return false;
  return true;
}

function headline(code) {
  if (code.discount_type === 'free_delivery' || code.is_free_delivery) return 'Free delivery on your order';
  if (code.discount_type === 'percentage') return `${code.discount_value}% off your order`;
  return `₦${Number(code.discount_value || 0).toLocaleString()} off your order`;
}

export default function HomePromoCard() {
  const { data: promo } = useQuery({
    queryKey: ['home-promo-code'],
    queryFn: async () => {
      try {
        const codes = await base44.entities.PromoCode.filter({ is_active: true });
        const now = new Date();
        const usable = codes.filter(c => isUsable(c, now));
        // Free delivery first, then biggest fixed/percentage discount.
        usable.sort((a, b) => {
          const fa = a.discount_type === 'free_delivery' ? 1 : 0;
          const fb = b.discount_type === 'free_delivery' ? 1 : 0;
          if (fa !== fb) return fb - fa;
          return (b.discount_value || 0) - (a.discount_value || 0);
        });
        return usable[0] || null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!promo) return null;

  const redeem = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      toast.success(`Code ${promo.code} copied — paste it at checkout`);
    } catch {
      toast.success(`Use code ${promo.code} at checkout`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 mb-5 bg-gradient-to-br from-fooda-green to-fooda-green-light shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[17px] leading-snug text-fooda-gold-light">{headline(promo)}</p>
          <p className="text-[13px] text-white/90 mt-1 leading-snug">
            Use code <span className="font-semibold text-white">{promo.code}</span> at checkout to unlock your discount.
            {promo.min_order_amount > 0 && (
              <span className="text-white/70"> Min. order ₦{Number(promo.min_order_amount).toLocaleString()}.</span>
            )}
          </p>
          <button
            onClick={redeem}
            className="mt-3 bg-white text-gray-900 text-[13px] font-semibold px-3.5 py-2 rounded-lg press"
            style={{ color: '#111111', backgroundColor: '#ffffff' }}
          >
            Redeem now
          </button>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-fooda-gold flex items-center justify-center flex-shrink-0">
          <Truck className="w-7 h-7" style={{ color: '#111111' }} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
