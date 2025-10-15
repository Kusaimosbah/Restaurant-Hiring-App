'use client';

import { useState } from 'react';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  color = 'yellow',
  interactive = false,
  onChange,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const colors = {
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    indigo: 'text-indigo-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
  };
  
  const starSize = sizes[size];
  const starColor = colors[color as keyof typeof colors] || colors.yellow;
  const emptyStarColor = 'text-gray-300';
  
  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };
  
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {Array(maxRating)
        .fill(0)
        .map((_, index) => {
          const starValue = index + 1;
          const isFilled = interactive
            ? starValue <= (hoverRating || rating)
            : starValue <= rating;
            
          return (
            <span
              key={index}
              className={`${interactive ? 'cursor-pointer' : ''} ${starSize} inline-block`}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(starValue)}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `Rate ${starValue} out of ${maxRating}` : `Rating: ${rating} out of ${maxRating}`}
            >
              {isFilled ? (
                <StarSolid className={`${starSize} ${starColor}`} />
              ) : (
                <StarOutline className={`${starSize} ${emptyStarColor}`} />
              )}
            </span>
          );
        })}
    </div>
  );
}

export function StarRatingDisplay({ rating, maxRating = 5, size = 'md', className = '' }: Omit<StarRatingProps, 'interactive' | 'onChange' | 'color'>) {
  // Calculate full, half, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const starSize = sizes[size];
  
  return (
    <div className={`flex items-center ${className}`}>
      {/* Full stars */}
      {Array(fullStars).fill(0).map((_, i) => (
        <StarSolid key={`full-${i}`} className={`${starSize} text-yellow-400`} />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <span className="relative">
          <StarOutline className={`${starSize} text-gray-300`} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarSolid className={`${starSize} text-yellow-400`} />
          </span>
        </span>
      )}
      
      {/* Empty stars */}
      {Array(emptyStars).fill(0).map((_, i) => (
        <StarOutline key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      ))}
    </div>
  );
}
