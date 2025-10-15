# Review & Rating System

This document outlines the Review & Rating System implemented for the Restaurant Hiring App.

## Overview

The Review & Rating System allows:
- Restaurant owners to review workers
- Workers to review restaurants
- Both parties to view their reviews and ratings
- Display of reputation metrics based on review data

## Components

### Core Components

1. **StarRating**
   - Interactive and non-interactive star rating display
   - Configurable size, color, and max rating
   - Supports half-star ratings for display

2. **ReviewCard**
   - Displays individual reviews with reviewer information
   - Shows rating, comment, and date
   - Expandable comment section
   - View details button

3. **ReviewForm**
   - Form for submitting new reviews
   - Star rating selector
   - Comment field
   - Public/private toggle

4. **ReviewSummary**
   - Displays average rating and total review count
   - Shows rating distribution (5★ to 1★)
   - Write review button

5. **ReviewList**
   - Displays a list of reviews
   - Pagination with "Load More" functionality
   - Empty state handling
   - Loading state with skeletons

6. **ReputationBadge**
   - Visual representation of reputation metrics
   - Different badge levels (bronze, silver, gold, platinum, diamond)
   - Support for different metrics (rating, experience, reliability, popularity)

### Integration

The components are integrated into the `/dashboard/reviews` page, which:
- Fetches reviews from the API
- Displays review summary and list
- Allows writing new reviews
- Shows detailed view of individual reviews

## API Integration

The system integrates with the following API endpoints:

### GET /api/reviews
- Fetches reviews for a specific target (worker or restaurant)
- Query parameters:
  - `targetType`: 'worker' or 'restaurant'
  - `targetId`: ID of the target entity
  - `page`: Page number for pagination
  - `limit`: Number of reviews per page
- Returns:
  - `reviews`: Array of review objects
  - `averageRating`: Average rating
  - `totalReviews`: Total number of reviews

### POST /api/reviews
- Creates a new review or updates an existing one
- Request body:
  - `targetType`: 'worker' or 'restaurant'
  - `targetId`: ID of the target entity
  - `rating`: Number from 1 to 5
  - `comment`: Optional comment text
  - `isPublic`: Boolean indicating if the review is public

## Data Models

The system works with the following database models:

### ReviewWorker
- Reviews given to workers by restaurant owners
- Fields:
  - `id`: Unique identifier
  - `rating`: Number from 1 to 5
  - `comment`: Optional text
  - `isPublic`: Boolean
  - `workerId`: Worker being reviewed
  - `restaurantId`: Restaurant giving the review
  - `createdAt`/`updatedAt`: Timestamps

### ReviewRestaurant
- Reviews given to restaurants by workers
- Fields:
  - `id`: Unique identifier
  - `rating`: Number from 1 to 5
  - `comment`: Optional text
  - `isPublic`: Boolean
  - `restaurantId`: Restaurant being reviewed
  - `workerId`: Worker giving the review
  - `createdAt`/`updatedAt`: Timestamps

## Usage Guidelines

### StarRating Component

```jsx
// Interactive rating
<StarRating 
  rating={3} 
  interactive 
  onChange={(newRating) => console.log(newRating)} 
  size="lg" 
/>

// Display-only rating
<StarRating rating={4.5} size="md" />
```

### ReviewForm Component

```jsx
<ReviewForm
  onSubmit={async (data) => {
    // Submit review to API
    await submitReview(data);
  }}
  isLoading={submitting}
  targetName="Restaurant Name"
/>
```

### ReviewSummary Component

```jsx
<ReviewSummary
  averageRating={4.2}
  totalReviews={42}
  ratingDistribution={[
    { rating: 5, count: 20, percentage: 47.6 },
    { rating: 4, count: 15, percentage: 35.7 },
    { rating: 3, count: 5, percentage: 11.9 },
    { rating: 2, count: 1, percentage: 2.4 },
    { rating: 1, count: 1, percentage: 2.4 },
  ]}
  onWriteReview={() => setShowReviewForm(true)}
/>
```

### ReputationDisplay Component

```jsx
<ReputationDisplay
  rating={4.8}
  experience={7}
  reliability={95}
  popularity={25}
/>
```

## Future Enhancements

1. **Review Verification**
   - Verify that reviews come from actual work relationships
   - Allow marking reviews as verified

2. **Response System**
   - Allow users to respond to reviews
   - Show responses alongside reviews

3. **Review Helpfulness**
   - Let users mark reviews as helpful
   - Sort reviews by helpfulness

4. **Review Filtering**
   - Filter reviews by rating, date, etc.
   - Search within review text

5. **Review Analytics**
   - Show trends over time
   - Identify common themes in reviews
