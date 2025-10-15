'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { StarIcon, TrophyIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import StarRating from './StarRating';

type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type BadgeType = 'rating' | 'experience' | 'reliability' | 'popularity';

interface ReputationBadgeProps {
  type: BadgeType;
  level: BadgeLevel;
  value: number;
  maxValue?: number;
  label?: string;
  className?: string;
}

export default function ReputationBadge({
  type,
  level,
  value,
  maxValue = 5,
  label,
  className = '',
}: ReputationBadgeProps) {
  const badgeLevelColors = {
    bronze: 'bg-amber-700',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-400',
    platinum: 'bg-blue-400',
    diamond: 'bg-purple-500',
  };
  
  const badgeTextColors = {
    bronze: 'text-amber-700',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    platinum: 'text-blue-500',
    diamond: 'text-purple-500',
  };
  
  const badgeIcons = {
    rating: StarIcon,
    experience: TrophyIcon,
    reliability: ShieldCheckIcon,
    popularity: UserGroupIcon,
  };
  
  const BadgeIcon = badgeIcons[type];
  const badgeColor = badgeLevelColors[level];
  const textColor = badgeTextColors[level];
  
  const badgeLabels = {
    rating: 'Rating',
    experience: 'Experience',
    reliability: 'Reliability',
    popularity: 'Popularity',
  };
  
  const displayLabel = label || badgeLabels[type];
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className={`${badgeColor} h-2`}></div>
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-2">
          <BadgeIcon className={`h-8 w-8 ${textColor}`} />
        </div>
        <h3 className="font-medium text-gray-900">{displayLabel}</h3>
        
        {type === 'rating' ? (
          <div className="flex justify-center mt-2">
            <StarRating rating={value} maxRating={maxValue} />
          </div>
        ) : (
          <div className="mt-2">
            <span className={`text-xl font-bold ${textColor}`}>{value}</span>
            {maxValue && <span className="text-gray-500 text-sm">/{maxValue}</span>}
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500 font-medium uppercase">
          {level} level
        </div>
      </CardContent>
    </Card>
  );
}

interface ReputationDisplayProps {
  rating: number;
  experience: number;
  reliability: number;
  popularity: number;
  className?: string;
}

export function ReputationDisplay({
  rating,
  experience,
  reliability,
  popularity,
  className = '',
}: ReputationDisplayProps) {
  // Calculate badge levels based on values
  const getRatingLevel = (value: number): BadgeLevel => {
    if (value >= 4.8) return 'diamond';
    if (value >= 4.5) return 'platinum';
    if (value >= 4.0) return 'gold';
    if (value >= 3.5) return 'silver';
    return 'bronze';
  };
  
  const getExperienceLevel = (value: number): BadgeLevel => {
    if (value >= 10) return 'diamond';
    if (value >= 7) return 'platinum';
    if (value >= 5) return 'gold';
    if (value >= 3) return 'silver';
    return 'bronze';
  };
  
  const getReliabilityLevel = (value: number): BadgeLevel => {
    if (value >= 95) return 'diamond';
    if (value >= 90) return 'platinum';
    if (value >= 80) return 'gold';
    if (value >= 70) return 'silver';
    return 'bronze';
  };
  
  const getPopularityLevel = (value: number): BadgeLevel => {
    if (value >= 50) return 'diamond';
    if (value >= 30) return 'platinum';
    if (value >= 20) return 'gold';
    if (value >= 10) return 'silver';
    return 'bronze';
  };
  
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
      <ReputationBadge
        type="rating"
        level={getRatingLevel(rating)}
        value={rating}
        maxValue={5}
        label="Rating"
      />
      <ReputationBadge
        type="experience"
        level={getExperienceLevel(experience)}
        value={experience}
        maxValue={10}
        label="Years Experience"
      />
      <ReputationBadge
        type="reliability"
        level={getReliabilityLevel(reliability)}
        value={reliability}
        maxValue={100}
        label="Reliability %"
      />
      <ReputationBadge
        type="popularity"
        level={getPopularityLevel(popularity)}
        value={popularity}
        label="Completed Jobs"
      />
    </div>
  );
}
