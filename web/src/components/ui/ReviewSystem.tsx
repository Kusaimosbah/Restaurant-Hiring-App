'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  restaurant?: { name: string };
  worker?: { user: { name: string } };
}

interface ReviewData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

interface ReviewSystemProps {
  targetType: 'worker' | 'restaurant';
  targetId: string;
  targetName: string;
  canReview?: boolean;
}

export default function ReviewSystem({ 
  targetType, 
  targetId, 
  targetName, 
  canReview = false 
}: ReviewSystemProps) {
  const { data: session } = useSession();
  const [reviewData, setReviewData] = useState<ReviewData>({
    reviews: [],
    averageRating: 0,
    totalReviews: 0
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?targetType=${targetType}&targetId=${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setReviewData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          rating,
          comment: comment.trim() || undefined,
          isPublic: true
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setComment('');
        setRating(5);
        loadReviews(); // Reload reviews
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            }`}
            disabled={!interactive}
          >
            <svg
              className={`w-5 h-5 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reviews for {targetName}</CardTitle>
          {canReview && !showReviewForm && (
            <Button 
              onClick={() => setShowReviewForm(true)}
              size="sm"
            >
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Average Rating */}
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold text-gray-900">
            {reviewData.averageRating.toFixed(1)}
          </div>
          <div>
            {renderStars(Math.round(reviewData.averageRating))}
            <p className="text-sm text-gray-500 mt-1">
              Based on {reviewData.totalReviews} review{reviewData.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Write a Review</h4>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                {renderStars(rating, true, setRating)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviewData.reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to leave a review!
            </p>
          ) : (
            reviewData.reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      {targetType === 'worker' ? (
                        <>by {review.restaurant?.name}</>
                      ) : (
                        <>by {review.worker?.user.name}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}