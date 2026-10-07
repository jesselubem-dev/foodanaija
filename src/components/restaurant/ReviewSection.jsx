import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import moment from 'moment';

export default function ReviewSection({ restaurant, reviews }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  
  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      // Not logged in
    }
  };

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const review = await base44.entities.Review.create(reviewData);
      
      // Update restaurant rating
      const allReviews = [...reviews, review];
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await base44.entities.Restaurant.update(restaurant.id, {
        rating: Math.round(avgRating * 10) / 10,
        total_reviews: allReviews.length
      });
      
      return review;
    },
    onMutate: async (newReview) => {
      await queryClient.cancelQueries({ queryKey: ['restaurant-reviews', restaurant.id] });
      
      const previousReviews = queryClient.getQueryData(['restaurant-reviews', restaurant.id]);
      
      queryClient.setQueryData(['restaurant-reviews', restaurant.id], (old) => [
        ...old,
        { ...newReview, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }
      ]);
      
      return { previousReviews };
    },
    onError: (err, newReview, context) => {
      queryClient.setQueryData(['restaurant-reviews', restaurant.id], context.previousReviews);
      toast.error('Failed to submit review');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant-reviews']);
      queryClient.invalidateQueries(['restaurant-detail']);
      setShowForm(false);
      setRating(0);
      setComment('');
      toast.success('Review submitted successfully!');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit a review');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    submitReviewMutation.mutate({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      customer_email: user.email,
      customer_name: user.full_name,
      rating,
      comment
    });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  const Stars = ({ value, size = 'w-4 h-4' }) => (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${size} ${star <= value ? 'fill-[#F5B700] text-[#F5B700]' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const resetForm = () => {
    setShowForm(false);
    setRating(0);
    setComment('');
  };

  return (
    <section>
      <h2 className="text-[15px] font-medium text-gray-900 mb-2.5">Reviews</h2>

      {/* Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-5">
          <div className="text-center flex-shrink-0">
            <p className="text-[34px] font-semibold text-gray-900 leading-none">{averageRating.toFixed(1)}</p>
            <div className="mt-1.5"><Stars value={Math.round(averageRating)} size="w-3.5 h-3.5" /></div>
            <p className="text-[11px] text-gray-500 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-3">{star}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fooda-gold rounded-full"
                    style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 w-full h-11 rounded-xl text-[13px] font-semibold uppercase tracking-wide f-btn-outline press"
          >
            Write a review
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-[13px] font-medium text-gray-900 mb-1.5">Your rating</p>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    className="transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 ${star <= (hoveredRating || rating) ? 'fill-[#F5B700] text-[#F5B700]' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="What did you enjoy? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[88px] rounded-xl border-gray-200 text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
            />

            <div className="flex gap-2.5">
              <button type="button" onClick={resetForm} className="flex-1 h-11 rounded-xl text-[14px] font-semibold f-btn-outline press">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitReviewMutation.isPending || rating === 0}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
              >
                {submitReviewMutation.isPending ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Review list */}
      {reviews.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {[...reviews]
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full f-tint-gold flex items-center justify-center flex-shrink-0 text-[14px] font-semibold f-text-amber">
                  {(review.customer_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{review.customer_name || 'Customer'}</p>
                    <Stars value={review.rating} size="w-3 h-3" />
                  </div>
                  <p className="text-[11px] text-gray-400">{moment(review.created_date).fromNow()}</p>
                  {review.comment && <p className="text-[13px] text-gray-700 mt-1.5">{review.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
