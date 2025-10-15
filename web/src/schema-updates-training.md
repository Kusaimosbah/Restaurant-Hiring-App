# Schema Updates for Onboarding & Training System

## New Models

### TrainingModule
- `id`: String (Primary Key)
- `title`: String
- `description`: String
- `order`: Int (for sorting)
- `isRequired`: Boolean
- `estimatedTimeMinutes`: Int
- `targetRole`: Role (enum - RESTAURANT_OWNER, WORKER, ADMIN)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- Relations:
  - `materials`: TrainingMaterial[] (One-to-Many)
  - `prerequisites`: TrainingModule[] (Many-to-Many self-relation)

### TrainingMaterial
- `id`: String (Primary Key)
- `title`: String
- `description`: String
- `type`: MaterialType (enum - VIDEO, DOCUMENT, QUIZ, INTERACTIVE)
- `content`: String (URL or JSON content)
- `order`: Int (for sorting within a module)
- `estimatedTimeMinutes`: Int
- `moduleId`: String (Foreign Key)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- Relations:
  - `module`: TrainingModule (Many-to-One)
  - `progress`: TrainingProgress[] (One-to-Many)

### TrainingProgress
- `id`: String (Primary Key)
- `userId`: String (Foreign Key)
- `materialId`: String (Foreign Key)
- `moduleId`: String (Foreign Key)
- `status`: ProgressStatus (enum - NOT_STARTED, IN_PROGRESS, COMPLETED)
- `score`: Int (for quizzes)
- `startedAt`: DateTime
- `completedAt`: DateTime
- `lastAccessedAt`: DateTime
- `timeSpentMinutes`: Int
- Relations:
  - `user`: User (Many-to-One)
  - `material`: TrainingMaterial (Many-to-One)
  - `module`: TrainingModule (Many-to-One)

## Enums

### MaterialType
- VIDEO
- DOCUMENT
- QUIZ
- INTERACTIVE

### ProgressStatus
- NOT_STARTED
- IN_PROGRESS
- COMPLETED

## Schema Updates

```prisma
// New enums
enum MaterialType {
  VIDEO
  DOCUMENT
  QUIZ
  INTERACTIVE
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

// New models
model TrainingModule {
  id                  String            @id @default(cuid())
  title               String
  description         String
  order               Int
  isRequired          Boolean           @default(true)
  estimatedTimeMinutes Int
  targetRole          Role
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  materials           TrainingMaterial[]
  progress            TrainingProgress[]
  
  // Self-relation for prerequisites
  prerequisites       TrainingModule[]  @relation("ModulePrerequisites")
  requiredFor         TrainingModule[]  @relation("ModulePrerequisites")

  @@map("training_modules")
}

model TrainingMaterial {
  id                  String            @id @default(cuid())
  title               String
  description         String
  type                MaterialType
  content             String            // URL or JSON content
  order               Int
  estimatedTimeMinutes Int
  moduleId            String
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  module              TrainingModule    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress            TrainingProgress[]

  @@index([moduleId])
  @@map("training_materials")
}

model TrainingProgress {
  id                  String            @id @default(cuid())
  userId              String
  materialId          String
  moduleId            String
  status              ProgressStatus    @default(NOT_STARTED)
  score               Int?              // For quizzes
  startedAt           DateTime?
  completedAt         DateTime?
  lastAccessedAt      DateTime?
  timeSpentMinutes    Int               @default(0)
  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  material            TrainingMaterial  @relation(fields: [materialId], references: [id], onDelete: Cascade)
  module              TrainingModule    @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([userId, materialId])
  @@index([userId])
  @@index([materialId])
  @@index([moduleId])
  @@map("training_progress")
}

// Update User model to include training progress
model User {
  // Existing fields...
  trainingProgress    TrainingProgress[]
}
```

## Migration Plan

1. Create a new migration file for these schema changes
2. Apply the migration to the database
3. Create seed data for initial training modules and materials
4. Update API endpoints to handle training data
5. Implement UI components for displaying and tracking training progress
