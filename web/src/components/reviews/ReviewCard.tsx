'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StarRating from './StarRating';
import Image from 'next/image';

interface ReviewCardProps {
  id: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  reviewerImage?: string;
  reviewDate: string;
  reviewerRole?: string;
  onViewDetails?: (id: string) => void;
  expanded?: boolean;
  className?: string;
}

export default function ReviewCard({
  id,
  rating,
  comment,
  reviewerName,
  reviewerImage,
  reviewDate,
  reviewerRole,
  onViewDetails,
  expanded = false,
  className = '',
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {reviewerImage ? (
              <div className="mr-3 flex-shrink-0">
                <Image
                  src={reviewerImage}
                  alt={reviewerName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            ) : (
              <div className="mr-3 flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 font-medium text-sm">
                  {reviewerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">{reviewerName}</h3>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-2">{formatDate(reviewDate)}</p>
                {reviewerRole && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {reviewerRole}
                  </span>
                )}
              </div>
            </div>
          </div>
          <StarRating rating={rating} size="sm" />
        </div>
        
        {comment && (
          <div className="mt-4">
            <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {comment}
            </p>
            {comment.length > 150 && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 focus:outline-none"
              >
                Read more
              </button>
            )}
          </div>
        )}
        
        {onViewDetails && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleViewDetails}>
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3 flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="h-5 w-5 bg-gray-200 rounded-full ml-1"></div>
            ))}
          </div>
        </div>
        <div className="mt-4 h-16 bg-gray-200 rounded"></div>
      </CardContent>
    </Card>
  );
}
