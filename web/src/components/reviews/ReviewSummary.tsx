'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StarRating from './StarRating';

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: RatingDistribution[];
  onWriteReview?: () => void;
  className?: string;
}

export default function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution = [],
  onWriteReview,
  className = '',
}: ReviewSummaryProps) {
  // Generate rating distribution if not provided
  const distribution = ratingDistribution.length > 0 
    ? ratingDistribution 
    : [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: 0,
        percentage: 0
      }));
  
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle>Reviews Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Average rating display */}
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size="md" className="my-2" />
            <div className="text-sm text-gray-500">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
            {onWriteReview && (
              <Button 
                onClick={onWriteReview}
                className="mt-4"
              >
                Write a Review
              </Button>
            )}
          </div>
          
          {/* Rating distribution */}
          <div className="flex-1 w-full max-w-md">
            {distribution.map((item) => (
              <div key={item.rating} className="flex items-center mb-2">
                <div className="w-12 text-sm text-gray-600 font-medium">
                  {item.rating} stars
                </div>
                <div className="flex-1 mx-3">
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-10 text-sm text-gray-500 text-right">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewSummarySkeleton() {
  return (
    <Card className="shadow-sm animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex flex-col items-center">
            <div className="h-12 w-16 bg-gray-200 rounded"></div>
            <div className="my-2 flex">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-5 w-5 bg-gray-200 rounded-full mx-0.5"></div>
              ))}
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded mt-1"></div>
            <div className="h-10 w-28 bg-gray-200 rounded mt-4"></div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center mb-2">
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 mx-3">
                  <div className="h-2 rounded-full bg-gray-200"></div>
                </div>
                <div className="w-10 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
