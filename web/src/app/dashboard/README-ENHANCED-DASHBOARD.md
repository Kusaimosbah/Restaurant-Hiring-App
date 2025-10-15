# Enhanced Dashboard with Role-Based Views

This feature provides a comprehensive dashboard experience with role-based views for restaurant owners and workers.

## Features

### For Restaurant Owners

1. **Statistics Widgets**
   - Total Jobs
   - Applications (with pending count)
   - Workers (with active count)
   - Job Fill Rate

2. **Trend Charts**
   - Applications over time
   - Hires over time
   - Revenue over time

3. **Quick Actions**
   - Post New Job
   - Review Applications
   - Manage Workers
   - View Analytics
   - Update Business Profile
   - Manage Schedule

4. **Recent Activity Feed**
   - Application submissions
   - Job postings
   - Worker assignments
   - Messages
   - Reviews
   - Filterable by activity type

5. **Performance Metrics**
   - Application Rate
   - Average Hire Time
   - Worker Retention
   - Active Positions

6. **Task Management**
   - View upcoming tasks
   - Add new tasks
   - Mark tasks as completed
   - Task prioritization

### For Workers

1. **Statistics Widgets**
   - Available Jobs
   - My Applications (with pending count)
   - Profile Completion
   - Total Earnings

2. **Trend Charts**
   - Applications over time
   - Earnings over time
   - Hours worked over time

3. **Quick Actions**
   - Browse Jobs
   - Update Profile
   - View My Applications
   - Check Schedule
   - Messages
   - View Earnings
   - Set Availability

4. **Recent Activity Feed**
   - Application status updates
   - Shift assignments
   - Messages
   - Profile updates
   - Filterable by activity type

5. **Application Status**
   - View status of all applications
   - Quick access to application details

6. **Profile Completion**
   - Track profile completion percentage
   - Quick access to incomplete sections

7. **Weekly Schedule**
   - View upcoming shifts
   - Shift details (time, location, position)

## Mobile Responsiveness

The dashboard is fully responsive and works well on:
- Desktop computers
- Tablets
- Mobile phones

Key mobile features:
- Collapsible sidebar navigation
- Mobile-optimized header
- Touch-friendly buttons and cards
- Responsive grid layouts
- Optimized spacing for small screens

## API Endpoints

### Dashboard Statistics
- `GET /api/dashboard/stats`
  - Returns different statistics based on user role
  - Includes trend data for charts

### Recent Activity
- `GET /api/dashboard/activity`
  - Returns recent activities based on user role
  - Supports filtering by activity type via `?type=` query parameter

### Tasks
- `GET /api/dashboard/tasks` - Get user tasks
- `POST /api/dashboard/tasks` - Create new task
- `PUT /api/dashboard/tasks` - Update existing task

## Components

### Shared Components
- `StatsCard` - Displays key statistics with trends
- `TrendChart` - Visualizes trend data
- `ActivityFeed` - Shows recent activities
- `QuickActions` - Provides role-based quick actions

### Admin-Specific Components
- `PerformanceMetrics` - Shows key performance indicators
- `TaskList` - Manages upcoming tasks

### Worker-Specific Components
- `ApplicationStatus` - Shows application statuses
- `ProfileCompletion` - Tracks profile completion
- `WeeklySchedule` - Displays upcoming shifts

## Testing

Use the `test-dashboard.js` script to test the dashboard functionality:

```bash
node test-dashboard.js
```

This script tests:
1. Authentication for both user roles
2. Dashboard statistics API
3. Activity feed API with filtering
4. Task management API (create, update)

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live updates

2. **Customizable Dashboard**
   - Allow users to customize widget layout and visibility

3. **Advanced Analytics**
   - More detailed charts and reports
   - Export functionality

4. **Calendar Integration**
   - Sync with external calendars (Google, Outlook)

5. **Notification Preferences**
   - Allow users to customize notification settings
