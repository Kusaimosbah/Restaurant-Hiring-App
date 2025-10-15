# Worker Profile Schema Updates

Based on the requirements for the Job Seeker Profile & Onboarding feature, we need to enhance the current `WorkerProfile` model with additional fields and related models.

## New Models to Add

### 1. WorkerSkill Model
```prisma
model WorkerSkill {
  id            String        @id @default(cuid())
  name          String
  experienceLevel SkillLevel  @default(BEGINNER)
  yearsOfExperience Float?
  workerId      String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  worker        WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@index([workerId])
  @@map("worker_skills")
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

### 2. Certification Model
```prisma
model Certification {
  id            String        @id @default(cuid())
  name          String
  issuingOrganization String
  issueDate     DateTime
  expirationDate DateTime?
  credentialId  String?
  verificationUrl String?
  documentUrl   String?
  isVerified    Boolean       @default(false)
  workerId      String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  worker        WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@index([workerId])
  @@map("certifications")
}
```

### 3. WorkerDocument Model
```prisma
model WorkerDocument {
  id            String        @id @default(cuid())
  name          String
  documentType  DocumentType
  filePath      String
  isVerified    Boolean       @default(false)
  notes         String?
  workerId      String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  worker        WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@index([workerId])
  @@map("worker_documents")
}

enum DocumentType {
  RESUME
  WORK_HISTORY
  ID_VERIFICATION
  REFERENCE_LETTER
  BACKGROUND_CHECK
  OTHER
}
```

## Updates to Existing WorkerProfile Model

```prisma
model WorkerProfile {
  id                String             @id @default(cuid())
  bio               String?
  experience        String?            // Keep for backward compatibility
  skills            String[]           // Keep for backward compatibility
  hourlyRate        Float?
  availability      String?            // Keep for backward compatibility
  userId            String             @unique
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  profilePictureUrl String?
  resumeUrl         String?            // Keep for backward compatibility
  
  // New fields
  title             String?            // Job title/position
  yearsOfExperience Float?             // Total years of experience
  contactEmail      String?            // Additional contact email (different from user email)
  contactPhone      String?            // Additional contact phone (different from user phone)
  preferredContactMethod String?       // Email, Phone, etc.
  address           String?            // Address information
  city              String?
  state             String?
  zipCode           String?
  
  // Relations
  applications      Application[]
  availabilitySlots AvailabilitySlot[]
  reviewsGiven      ReviewRestaurant[]
  reviewsReceived   ReviewWorker[]
  shiftAssignments  ShiftAssignment[]
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // New relations
  workerSkills      WorkerSkill[]
  certifications    Certification[]
  documents         WorkerDocument[]

  @@map("worker_profiles")
}
```

## Migration Steps

1. Create a new migration:
```
npx prisma migrate dev --name add-worker-profile-features
```

2. Update the seed file to include sample data for the new models
3. Update any existing code that references the WorkerProfile model to handle the new fields and relations
