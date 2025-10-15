# Job Seeker Profile & Onboarding

This document provides an overview of the Job Seeker Profile & Onboarding feature implemented in the Restaurant Hiring App.

## Overview

The Job Seeker Profile feature allows workers to create and manage their professional profiles, including:

- Personal information (name, title, bio, contact details)
- Professional skills with experience levels
- Certifications and qualifications
- Work history and verification documents

## Components

### Main Components

1. **JobSeekerProfile.tsx**
   - Main container component with tabbed interface
   - Handles API calls and state management
   - Coordinates between child components

2. **PersonalInfoForm.tsx**
   - Manages personal information and contact details
   - Handles profile picture uploads

3. **SkillsForm.tsx**
   - Manages professional skills with experience levels
   - Allows adding, editing, and deleting skills

4. **CertificationsForm.tsx**
   - Manages professional certifications
   - Tracks certification validity periods

5. **DocumentsForm.tsx**
   - Handles document uploads and management
   - Supports different document types (resume, work history, etc.)

## API Endpoints

### Worker Profile

- `GET /api/worker/profile` - Get worker profile
- `PUT /api/worker/profile` - Update worker profile

### Skills

- `GET /api/worker/skills` - Get all skills
- `POST /api/worker/skills` - Add a new skill
- `GET /api/worker/skills/:id` - Get a specific skill
- `PUT /api/worker/skills/:id` - Update a skill
- `DELETE /api/worker/skills/:id` - Delete a skill

### Certifications

- `GET /api/worker/certifications` - Get all certifications
- `POST /api/worker/certifications` - Add a new certification
- `GET /api/worker/certifications/:id` - Get a specific certification
- `PUT /api/worker/certifications/:id` - Update a certification
- `DELETE /api/worker/certifications/:id` - Delete a certification

### Documents

- `GET /api/worker/documents` - Get all documents
- `POST /api/worker/documents` - Add a new document
- `GET /api/worker/documents/:id` - Get a specific document
- `PUT /api/worker/documents/:id` - Update a document
- `DELETE /api/worker/documents/:id` - Delete a document
- `POST /api/worker/documents/upload` - Upload a document file

## Database Schema

The feature uses the following database models:

- **WorkerProfile**: Core profile information
- **WorkerSkill**: Skills with experience levels
- **Certification**: Professional certifications
- **WorkerDocument**: Uploaded documents

## Testing

You can test the API endpoints using the `test-worker-profile.js` script:

```bash
cd web
node test-worker-profile.js
```

## Usage

To access the Job Seeker Profile:

1. Log in as a worker
2. Navigate to `/dashboard/profile/worker`
3. Use the tabbed interface to manage different aspects of your profile

## Future Enhancements

- Integration with third-party verification services
- Skills endorsements from employers
- Advanced document verification
- Public profile sharing options
