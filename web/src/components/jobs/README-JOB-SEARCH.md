# Job Search & Discovery Interface

This feature provides a comprehensive job search and discovery experience for workers in the Restaurant Hiring App.

## Features

### Advanced Search Capabilities

1. **Keyword Search**
   - Search jobs by title, description, or restaurant name
   - Intelligent matching for relevant results

2. **Location-Based Search**
   - Filter jobs by location (city, state, or zip code)
   - Adjustable radius search (1-50 miles)
   - Map view for spatial job discovery

3. **Salary Filtering**
   - Minimum and maximum hourly rate range selection
   - Sort by highest paying jobs

4. **Date-Based Filtering**
   - Filter by job start and end dates
   - Find jobs matching your availability

5. **Job Type Filtering**
   - Filter by position type (Server, Bartender, Chef, etc.)
   - Quick-select job type tags

### Job Discovery Features

1. **Personalized Recommendations**
   - Jobs matching your skills and experience
   - Based on previous applications and profile data
   - Displayed prominently at the top of search results

2. **Map View**
   - Visual representation of job locations
   - Interactive markers with job details
   - Location-based job clustering
   - Toggle between map and list views

3. **Save/Favorite Functionality**
   - Save interesting jobs for later
   - View all saved jobs in one place
   - Remove jobs from saved list

4. **One-Tap Application**
   - Quick apply directly from search results
   - Optional message to employer
   - Streamlined application process

### Mobile-Optimized Experience

The entire job search interface is fully responsive and optimized for mobile devices:

- Collapsible filters for small screens
- Touch-friendly controls
- Optimized map view for mobile
- Responsive grid layouts
- Mobile-first design approach

## API Endpoints

### Job Search
- `GET /api/jobs/search` - Search jobs with filters
  - Query parameters: query, location, radius, minHourlyRate, maxHourlyRate, jobTypes, startDate, endDate, sortBy, page, limit

### Job Recommendations
- `GET /api/jobs/recommendations` - Get personalized job recommendations

### Saved Jobs
- `GET /api/jobs/saved` - Get user's saved jobs
- `POST /api/jobs/saved` - Save or unsave a job
  - Body: { jobId, saved }

### Job Applications
- `POST /api/applications` - Apply to a job
  - Body: { jobId, message }

## Components

### Main Components
- `JobSearch` - Main container component for job search functionality
- `JobMap` - Map view for location-based job search
- `QuickApply` - Modal for one-tap job applications

### Supporting Components
- `StatsCard` - Displays job statistics
- `TrendChart` - Shows job trends over time
- `ActivityFeed` - Displays recent job activity
- `TaskList` - Manages job-related tasks

## Testing

Use the `test-job-search.js` script to test the job search functionality:

```bash
node test-job-search.js
```

This script tests:
1. Basic job listing
2. Job search with filters
3. Job recommendations
4. Saving and unsaving jobs
5. Job application process

## Future Enhancements

1. **Advanced Location Features**
   - Geolocation-based search
   - Commute time calculations
   - Public transit accessibility

2. **Enhanced Filtering**
   - Filter by restaurant ratings
   - Filter by shift type (morning, evening, etc.)
   - Filter by job benefits

3. **AI-Powered Recommendations**
   - Improved job matching algorithms
   - Personalized job suggestions
   - Career path recommendations

4. **Social Features**
   - Share jobs with friends
   - Referral system
   - Team applications

5. **Real-Time Updates**
   - Live job notifications
   - Application status tracking
   - Interview scheduling