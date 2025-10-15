# Restaurant Hiring App

A modern platform connecting restaurants with skilled workers in the hospitality industry.

## Features

### Phase 1 (Core Features)

- ✅ **Business Profile Management**: Complete restaurant profile with details, locations, photos, and payment info
- ✅ **Job Seeker Profile & Onboarding**: Worker profiles with personal info, skills, certifications, and documents
- ✅ **Enhanced Dashboard with Role-Based Views**: Customized dashboards for restaurant owners and workers
- ✅ **Job Search & Discovery Interface**: Advanced job search with filters, map view, and recommendations
- ✅ **Mobile-First Responsive Design**: Optimized experience across all device sizes
- ✅ **Review & Rating System**: Two-way review system for restaurants and workers

### Phase 2 (Enhanced Features)

- ✅ **Comprehensive Notification System**: Real-time notifications, email alerts, and preference management
- ✅ **Onboarding & Training System**: Guided onboarding flows and training materials
- ⬜ **Advanced Scheduling & Availability**: Calendar integration and shift management
- ⬜ **Integrated Chat System**: Real-time messaging between restaurants and workers
- ⬜ **Payment Processing & Invoicing**: Secure payment processing and automated invoicing
- ⬜ **Analytics & Reporting Dashboard**: Detailed insights and performance metrics

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/restaurant-hiring-app.git
   cd restaurant-hiring-app
   ```

2. Start the PostgreSQL database:
   ```
   docker-compose up -d
   ```

3. Install dependencies:
   ```
   cd web
   npm install
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` to set your database connection and other configuration options.

5. Apply database migrations:
   ```
   npx prisma migrate dev
   ```

6. Seed the database:
   ```
   npm run db:seed
   ```

7. Start the development server:
   ```
   npm run dev
   ```

8. Open [http://localhost:3001](http://localhost:3001) in your browser.

## User Accounts

The seed data creates the following test accounts:

### Restaurant Owner
- Email: owner@restaurant.com
- Password: password123

### Worker
- Email: worker@example.com
- Password: password123

## Architecture

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: React Context API and hooks
- **Maps**: Mapbox GL JS
- **Real-time Features**: Server-Sent Events (SSE)

## Key Components

### Business Profile Management
- Complete restaurant profile management
- Multiple location support
- Photo gallery
- Payment information

### Job Seeker Profile
- Personal information
- Skills and experience
- Certifications
- Document management

### Enhanced Dashboard
- Role-based views
- Performance metrics
- Activity feed
- Task management

### Job Search & Discovery
- Advanced filtering
- Map view with geolocation
- Job recommendations
- Quick apply functionality

### Mobile-First Responsive Design
- Optimized for all screen sizes
- Touch-friendly interface
- Responsive navigation
- Keyboard handling for forms

### Review & Rating System
- Two-way review system
- Rating summaries
- Detailed feedback
- Reputation management

### Notification System
- In-app notifications
- Email notifications
- Push notifications
- Notification preferences
- Real-time delivery

## Development

### Folder Structure

- `/web` - Next.js application
  - `/src` - Source code
    - `/app` - Next.js App Router
    - `/components` - React components
    - `/lib` - Utilities and services
    - `/hooks` - Custom React hooks
    - `/types` - TypeScript type definitions
  - `/prisma` - Database schema and migrations
  - `/public` - Static assets

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset the database

## Testing

- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.