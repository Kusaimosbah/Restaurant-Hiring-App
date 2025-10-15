export { default as StarRating } from './StarRating';
export { default as ReviewCard } from './ReviewCard';
export { default as ReviewForm } from './ReviewForm';
export { default as ReviewSummary } from './ReviewSummary';
export { default as ReviewList } from './ReviewList';
export { default as ReputationBadge, ReputationDisplay } from './ReputationBadge';

// Types for reviews
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    name: string;
    image?: string;
    role?: string;
  };
  target: {
    id: string;
    name: string;
    type: 'worker' | 'restaurant';
  };
}

export interface ReviewSummaryData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
}

export interface ReputationData {
  rating: number;
  experience: number;
  reliability: number;
  popularity: number;
}
