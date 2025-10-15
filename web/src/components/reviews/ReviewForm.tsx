'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StarRating from './StarRating';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string; isPublic: boolean }) => Promise<void>;
  initialRating?: number;
  initialComment?: string;
  initialIsPublic?: boolean;
  isLoading?: boolean;
  isEdit?: boolean;
  targetName?: string;
  className?: string;
}

export default function ReviewForm({
  onSubmit,
  initialRating = 0,
  initialComment = '',
  initialIsPublic = true,
  isLoading = false,
  isEdit = false,
  targetName,
  className = '',
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setError(null);
    
    try {
      await onSubmit({ rating, comment, isPublic });
      // Don't reset form on success - parent component should handle navigation or reset
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    }
  };
  
  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Edit Review' : 'Write a Review'}
          {targetName && ` for ${targetName}`}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <StarRating
                rating={rating}
                interactive
                onChange={setRating}
                size="lg"
              />
              <span className="ml-2 text-sm text-gray-500">
                {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
              </span>
            </div>
            {error && rating === 0 && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="is-public"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="is-public" className="ml-2 block text-sm text-gray-700">
              Make this review public
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
