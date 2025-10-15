'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import ReviewCard, { ReviewCardSkeleton } from './ReviewCard';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    image?: string;
    role?: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  onViewDetails?: (id: string) => void;
  emptyMessage?: string;
  loadMoreText?: string;
  onLoadMore?: () => void;
  hasMoreReviews?: boolean;
  className?: string;
}

export default function ReviewList({
  reviews,
  loading = false,
  onViewDetails,
  emptyMessage = 'No reviews yet',
  loadMoreText = 'Load More Reviews',
  onLoadMore,
  hasMoreReviews = false,
  className = '',
}: ReviewListProps) {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  
  const handleToggleExpand = (id: string) => {
    setExpandedReviewId(expandedReviewId === id ? null : id);
  };
  
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          id={review.id}
          rating={review.rating}
          comment={review.comment}
          reviewerName={review.reviewer.name}
          reviewerImage={review.reviewer.image}
          reviewDate={review.createdAt}
          reviewerRole={review.reviewer.role}
          expanded={expandedReviewId === review.id}
          onViewDetails={onViewDetails ? () => onViewDetails(review.id) : () => handleToggleExpand(review.id)}
        />
      ))}
      
      {hasMoreReviews && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            {loadMoreText}
          </Button>
        </div>
      )}
    </div>
  );
}
