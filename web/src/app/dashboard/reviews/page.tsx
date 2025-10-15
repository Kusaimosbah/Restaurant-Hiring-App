'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ReviewList, 
  ReviewSummary, 
  ReviewForm, 
  ReputationDisplay,
  ReviewSummaryData,
  Review as ReviewType
} from '@/components/reviews';

// Convert API response to our component format
interface ApiReview {
  id: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  restaurant?: {
    id?: string;
    name?: string;
  };
  worker?: {
    id?: string;
    user?: {
      id?: string;
      name?: string;
    }
  };
}

export default function ReviewsPage() {
  const { data: sessionData, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get('id');
  const targetId = searchParams.get('targetId');
  const targetType = searchParams.get('targetType');
  
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ReviewSummaryData>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: []
  });
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  const isAdmin = sessionData?.user?.role === 'RESTAURANT_OWNER';
  
  // Determine what type of reviews to show based on user role
  const getTargetTypeAndId = () => {
    // If URL params are provided, use those
    if (targetType && targetId) {
      return { type: targetType, id: targetId };
    }
    
    // Otherwise, determine based on user role
    if (isAdmin) {
      return { type: 'worker', id: '' }; // Show worker reviews for admins
    } else {
      return { type: 'restaurant', id: '' }; // Show restaurant reviews for workers
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!sessionData) {
      router.push('/auth/signin');
      return;
    }
    loadReviews();
  }, [sessionData, status, router, targetType, targetId]);

  useEffect(() => {
    if (reviewId && reviews.length > 0) {
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        setSelectedReview(review);
      }
    }
  }, [reviewId, reviews]);

  const loadReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const { type, id } = getTargetTypeAndId();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('targetType', type);
      if (id) params.append('targetId', id);
      params.append('page', pageNum.toString());
      params.append('limit', '10');
      
      // Fetch reviews from API
      const response = await fetch(`/api/reviews?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert API response to our component format
      const formattedReviews = data.reviews.map((review: ApiReview) => {
        let reviewerName = 'Unknown';
        let reviewerId = '';
        let reviewerImage;
        let reviewerRole;
        
        if (type === 'worker' && review.restaurant) {
          reviewerName = review.restaurant.name || 'Unknown Restaurant';
          reviewerId = review.restaurant.id || '';
          reviewerRole = 'Restaurant';
        } else if (type === 'restaurant' && review.worker?.user) {
          reviewerName = review.worker.user.name || 'Unknown Worker';
          reviewerId = review.worker.id || '';
          reviewerRole = 'Worker';
        }
        
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          isPublic: review.isPublic,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          reviewer: {
            id: reviewerId,
            name: reviewerName,
            image: reviewerImage,
            role: reviewerRole
          },
          target: {
            id: id || '',
            name: '',
            type: type as 'worker' | 'restaurant'
          }
        };
      });
      
      // Update state
      if (pageNum === 1) {
        setReviews(formattedReviews);
      } else {
        setReviews(prev => [...prev, ...formattedReviews]);
      }
      
      setPage(pageNum);
      setHasMoreReviews(formattedReviews.length === 10); // Assuming 10 is the page size
      
      // Update summary data
      setSummaryData({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        ratingDistribution: calculateDistribution(data.reviews)
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setLoading(false);
    }
  };
  
  // Calculate rating distribution from reviews
  const calculateDistribution = (reviewsData: ApiReview[]) => {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = reviewsData.filter(r => r.rating === rating).length;
      const percentage = reviewsData.length > 0 ? (count / reviewsData.length) * 100 : 0;
      return { rating, count, percentage };
    });
    
    return distribution;
  };

  // Handle submitting a new review
  const handleSubmitReview = async (data: { rating: number; comment: string; isPublic: boolean }) => {
    try {
      setSubmittingReview(true);
      const { type, id } = getTargetTypeAndId();
      
      if (!id) {
        throw new Error('No target ID provided for review');
      }
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: type,
          targetId: id,
          rating: data.rating,
          comment: data.comment,
          isPublic: data.isPublic
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit review: ${response.status}`);
      }
      
      // Refresh reviews
      await loadReviews();
      setShowWriteReview(false);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };
  
  // Handle viewing review details
  const handleViewReviewDetails = (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (review) {
      setSelectedReview(review);
    }
  };
  
  // Handle loading more reviews
  const handleLoadMore = () => {
    loadReviews(page + 1);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Reviews"
          subtitle={selectedReview ? `Review details` : `${isAdmin ? 'Worker' : 'Restaurant'} reviews`}
        />
        
        <div className="p-4 sm:p-6">
          {showWriteReview ? (
            <div className="mb-6">
              <ReviewForm 
                onSubmit={handleSubmitReview}
                isLoading={submittingReview}
                targetName={targetId ? `ID: ${targetId}` : undefined}
              />
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowWriteReview(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : selectedReview ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Review from {selectedReview.reviewer.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    {selectedReview.reviewer.role && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-2">
                        {selectedReview.reviewer.role}
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    <StarRating rating={selectedReview.rating} size="md" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium">Comment</h3>
                  <p className="mt-2 text-gray-700">{selectedReview.comment || 'No comment provided.'}</p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedReview(null)}
                    className="mr-2"
                  >
                    Back to All Reviews
                  </Button>
                  {isAdmin && selectedReview.reviewer.role === 'Worker' && (
                    <Button>
                      Contact Worker
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Review Summary */}
              <ReviewSummary
                averageRating={summaryData.averageRating}
                totalReviews={summaryData.totalReviews}
                ratingDistribution={summaryData.ratingDistribution}
                onWriteReview={targetId ? () => setShowWriteReview(true) : undefined}
              />
              
              {/* Review List */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {isAdmin ? 'Worker Reviews' : 'Restaurant Reviews'}
                  </h2>
                  {targetId && !showWriteReview && (
                    <Button onClick={() => setShowWriteReview(true)}>
                      Write a Review
                    </Button>
                  )}
                </div>
                
                <ReviewList
                  reviews={reviews.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    reviewer: {
                      id: review.reviewer.id,
                      name: review.reviewer.name,
                      image: review.reviewer.image,
                      role: review.reviewer.role
                    }
                  }))}
                  loading={loading}
                  onViewDetails={handleViewReviewDetails}
                  emptyMessage={`No ${isAdmin ? 'worker' : 'restaurant'} reviews yet.`}
                  loadMoreText="Load More Reviews"
                  onLoadMore={hasMoreReviews ? handleLoadMore : undefined}
                  hasMoreReviews={hasMoreReviews}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
