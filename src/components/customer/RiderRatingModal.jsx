import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Bike } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const SKIPPED_KEY = 'skipped_rider_ratings';

// Orders the customer chose not to rate, so the prompt doesn't keep coming back.
export function hasSkippedRiderRating(orderId) {
  try { return JSON.parse(localStorage.getItem(SKIPPED_KEY) || '[]').includes(orderId); } catch { return false; }
}
function rememberSkip(orderId) {
  try {
    const list = JSON.parse(localStorage.getItem(SKIPPED_KEY) || '[]');
    if (!list.includes(orderId)) localStorage.setItem(SKIPPED_KEY, JSON.stringify([...list, orderId].slice(-50)));
  } catch {}
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export default function RiderRatingModal({ order, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkip = () => {
    rememberSkip(order.id);
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please choose a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.RiderRating.create({
        rider_id: order.rider_id,
        rider_name: order.rider_name,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        order_id: order.id,
        rating,
        comment: comment || null,
      });
      toast.success('Thanks for your feedback!');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Could not submit your rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shown = hoverRating || rating;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkip}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rider-rating-title"
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl mb-[env(safe-area-inset-bottom)]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 380 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full f-tint-gold flex items-center justify-center mb-3">
              <Bike className="w-7 h-7 f-text-gold" />
            </div>
            <h2 id="rider-rating-title" className="text-[18px] font-semibold text-gray-900">How was your delivery?</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Rate {order.rider_name || 'your rider'} from {order.restaurant_name || 'your order'}
            </p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mt-5" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                className="p-1"
              >
                <Star className={`w-10 h-10 transition-colors ${star <= shown ? 'fill-[#F5B700] text-[#F5B700]' : 'text-gray-300'}`} />
              </motion.button>
            ))}
          </div>
          <p className="text-center text-[13px] font-medium text-gray-700 h-5 mt-1">{LABELS[shown]}</p>

          <Textarea
            placeholder="Anything to add? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-3 resize-none h-20 rounded-xl border-gray-200 text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
          />

          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl text-[14px] font-semibold f-btn-outline disabled:opacity-50 press"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 h-12 rounded-xl text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
