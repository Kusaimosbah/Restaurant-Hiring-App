# Onboarding & Training System

This document provides an overview of the Onboarding & Training System implementation for the Restaurant Hiring App.

## Features

### 1. Training Modules
- Organized training content with prerequisites
- Role-based access control (different training for restaurant owners vs. workers)
- Progress tracking for each module
- Support for required vs. optional modules

### 2. Training Materials
- Multiple content types:
  - Videos
  - Documents
  - Interactive quizzes
  - Interactive exercises
- Estimated completion time
- Sequential progression through materials

### 3. Progress Tracking
- Module and material completion status
- Quiz scores and attempts
- Time spent on training
- Overall training completion percentage

### 4. User Interface
- Training dashboard with module cards
- Filtering by completion status (all, in-progress, completed)
- Material viewer with navigation between materials
- Quiz interface with automatic scoring

## Database Schema

The training system uses three main tables:
- `training_modules`: For organizing training content
- `training_materials`: For actual content (videos, documents, quizzes)
- `training_progress`: To track user completion

## API Endpoints

### Modules
- `GET /api/training/modules`: Get all training modules
- `GET /api/training/modules/:id`: Get a specific module with materials and progress

### Materials
- `GET /api/training/materials/:id`: Get a specific material with progress
- `PUT /api/training/materials/:id`: Update progress for a material

### Progress
- `GET /api/training/progress`: Get user's overall training progress

## Components

### 1. TrainingDashboard
Main dashboard showing all available training modules with progress indicators.

### 2. ModuleDetail
Detailed view of a specific module showing all materials and prerequisites.

### 3. MaterialViewer
Component for viewing and interacting with training materials, including:
- Video player
- Document viewer
- Quiz interface
- Interactive exercise launcher

## Integration Points

The training system integrates with:
- User authentication system (for role-based access)
- User profiles (for tracking progress)
- Navigation system (sidebar links)

## Future Enhancements

Potential future improvements:
- Certificate generation upon completion
- Team training assignments
- Training analytics for managers
- Gamification elements (badges, leaderboards)
- More interactive training content types
