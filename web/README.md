# Restaurant Hiring App 🍽️

A full-stack MVP web application where restaurants can hire workers (servers, chefs) for one-day or specific-day shifts. Built with Next.js 15, Prisma, PostgreSQL, and NextAuth.

## 🏗️ Architecture Overview

This is a **monolithic Next.js application** that combines both frontend and backend in a single codebase for rapid MVP development.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (Dockerized)
- **ORM**: Prisma
- **Authentication**: NextAuth with credentials provider
- **Styling**: TailwindCSS
- **Deployment**: Vercel-ready
- **CI/CD**: GitHub Actions

### Application Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • React Pages   │◄──►│ • API Routes    │◄──►│ • PostgreSQL    │
│ • Components    │    │ • NextAuth      │    │ • Prisma ORM    │
│ • Client Hooks  │    │ • Server Actions│    │ • Docker        │
│ • TailwindCSS   │    │ • Middleware    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
web/
├── prisma/
│   ├── schema.prisma          # Database schema with all models
│   └── seed.ts               # Demo data seeding script
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes
│   │   │   ├── auth/[...nextauth]/  # Authentication endpoints
│   │   │   ├── register/            # User registration
│   │   │   ├── jobs/               # Job management
│   │   │   └── applications/       # Application handling
│   │   ├── auth/             # Authentication pages
│   │   │   └── signin/       # Sign-in page
│   │   ├── dashboard/        # User dashboard
│   │   ├── globals.css       # Global styles
│   │   └── layout.tsx        # Root layout
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client configuration
│   │   └── auth.ts           # NextAuth configuration
│   └── types/
│       └── next-auth.d.ts    # NextAuth type definitions
├── .env.local                # Environment variables
├── package.json              # Dependencies and scripts
├── tailwind.config.ts        # TailwindCSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and basic profile
- **Restaurant**: Restaurant profiles and information
- **WorkerProfile**: Worker skills, experience, and availability
- **Job**: Job postings with requirements and pay rates
- **Application**: Job applications from workers
- **ShiftAssignment**: Accepted applications converted to shifts
- **ReviewWorker**: Restaurant reviews of workers
- **ReviewRestaurant**: Worker reviews of restaurants
- **AvailabilitySlot**: Worker availability schedules
- **OnboardingDocument**: Document management

### User Roles
- **RESTAURANT_OWNER**: Can create restaurants, post jobs, review applications
- **WORKER**: Can apply to jobs, manage availability, receive reviews

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Restaurant-Hiring-App
   ```

2. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local .env
   # Edit .env with your actual values if needed
   ```

4. **Start the PostgreSQL database**
   ```bash
   cd ..
   docker-compose up -d
   ```

5. **Generate Prisma client**
   ```bash
   cd web
   npm run db:generate
   ```

6. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

7. **Seed the database with demo data**
   ```bash
   npm run db:seed
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open the application**
   
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

After seeding, you can use these demo accounts:

**Restaurant Owner:**
- Email: `owner@restaurant.com`
- Password: `password123`
- Restaurant: "The Golden Fork"

**Worker:**
- Email: `worker@example.com` 
- Password: `password123`
- Profile: Experienced server with skills and availability

## 🎯 Core Features Implemented

### ✅ Authentication & Authorization
- [x] User registration with role selection
- [x] Secure login with NextAuth
- [x] Role-based access control (Restaurant Owner / Worker)
- [x] Session management

### ✅ Restaurant Management  
- [x] Restaurant profile creation
- [x] Restaurant information management
- [x] Owner dashboard

### ✅ Worker Profiles
- [x] Worker profile with bio, skills, experience
- [x] Hourly rate setting
- [x] Availability slot management
- [x] Worker dashboard

### ✅ Job Management
- [x] Job posting creation (title, description, requirements)
- [x] Hourly rate and shift timing
- [x] Job status management (Active, Filled, Cancelled)
- [x] Multi-worker job support

### ✅ Application System
- [x] Workers can apply to jobs with messages
- [x] Restaurant owners can view applications
- [x] Application status tracking (Pending, Accepted, Rejected)
- [x] Automatic shift assignment creation

### ✅ Database & Infrastructure
- [x] Complete Prisma schema
- [x] PostgreSQL with Docker
- [x] Database seeding with realistic demo data
- [x] CI/CD pipeline with GitHub Actions

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with demo data

# Database Management
npm run db:studio       # Open Prisma Studio (add to package.json)
npm run db:reset        # Reset database (add to package.json)
```

## 🔧 Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Run migration** with `npm run db:migrate`
3. **Update seed data** if needed in `prisma/seed.ts`
4. **Create API routes** in `src/app/api/`
5. **Build UI components** in `src/app/`
6. **Test locally** with demo accounts

## 📦 What's Next?

### High Priority Features
- [ ] **Job Search & Filtering**: Search jobs by location, pay rate, date
- [ ] **Application Management UI**: Restaurant owner application review interface
- [ ] **Shift Management**: Calendar view, shift status updates
- [ ] **Notifications**: Email/in-app notifications for applications
- [ ] **Profile Management**: Edit restaurant and worker profiles
- [ ] **File Uploads**: Profile pictures, documents, certifications

### Medium Priority Features  
- [ ] **Review System UI**: Rating and review interface
- [ ] **Calendar Integration**: Google Calendar sync for shifts
- [ ] **Payment Integration**: Stripe for shift payments
- [ ] **Mobile Responsiveness**: Optimize for mobile devices
- [ ] **Real-time Updates**: WebSocket for live notifications

### Low Priority / Future
- [ ] **Multi-location Support**: Chain restaurants
- [ ] **Advanced Analytics**: Dashboard with metrics
- [ ] **API Documentation**: OpenAPI/Swagger docs
- [ ] **Mobile App**: React Native app
- [ ] **Background Jobs**: Queue system for emails

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Environment Variables for Production
```bash
DATABASE_URL="your-production-postgres-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Hiring! 🍽️✨**
