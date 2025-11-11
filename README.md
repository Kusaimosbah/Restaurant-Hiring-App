# Restaurant Hiring App 🍽️

A comprehensive hospitality staffing platform connecting restaurants and coffee shops with short-term and long-term staff. Features advanced job matching, skills-based hiring, and seamless mobile experience for job seekers.

## 📋 **Current Status**
✅ **Authentication System Complete** - Registration, login, password reset with email functionality  
✅ **Database Schema & Migrations** - Full user management and job posting foundation  
✅ **Email Service Integration** - Professional email templates with Ethereal.email testing  
✅ **Mobile Application** - React Native app with offline capabilities and push notifications  
✅ **Advanced Security Features** - 2FA, audit logging, RBAC, data encryption, GDPR compliance  
✅ **Project Documentation** - Comprehensive roadmap and collaboration guides  
🚧 **In Development** - Real-time communication and analytics dashboard

## 📚 **Documentation**
- **[📋 PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)** - Complete feature specifications with user stories
- **[🤝 COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)** - Developer collaboration workflows and task assignments

## 📁 Project Structure

```
Restaurant-Hiring-App/
├── docker-compose.yml          # PostgreSQL database setup
├── Dockerfile.postgres         # Custom Ubuntu-based PostgreSQL container
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
└── web/                        # Next.js full-stack application
    ├── src/                    # Source code
    ├── prisma/                 # Database schema and migrations
    ├── package.json            # Dependencies and scripts
    └── README.md              # Detailed documentation
```

## 🚀 Quick Start

1. **Prerequisites**: Node.js 18+, Docker, Git
2. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd Restaurant-Hiring-App
   
   # Start database
   docker-compose up -d
   
   # Setup application
   cd web
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
3. **Open**: [http://localhost:3000](http://localhost:3000)

## 📖 Full Documentation

See [`web/README.md`](./web/README.md) for complete documentation including:
- Architecture overview
- Tech stack details
- API documentation
- Development workflow
- Deployment guide
- Contributing guidelines

## 🚀 Future Enhancements

See [`FUTURE_ENHANCEMENTS.md`](./FUTURE_ENHANCEMENTS.md) for expansion options:
- Mobile app development (PWA, React Native, Expo)
- Containerization and packaging (Docker, Kubernetes)
- Desktop app creation (Electron)
- Microservices architecture
- Priority recommendations and timeline

## 🧪 Demo Accounts

- **Restaurant Owner**: `owner@restaurant.com` / `password123`
- **Worker**: `worker@example.com` / `password123`

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + React + TailwindCSS
- **Backend**: Next.js API Routes + NextAuth
- **Database**: PostgreSQL + Prisma ORM
- **Infrastructure**: Docker + GitHub Actions
- **Deployment**: Vercel-ready

---

For detailed setup instructions, architecture details, and development guidelines, see the [complete documentation](./web/README.md) in the web directory.