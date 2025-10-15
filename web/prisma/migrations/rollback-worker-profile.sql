-- Drop foreign keys first
ALTER TABLE "worker_skills" DROP CONSTRAINT IF EXISTS "worker_skills_workerId_fkey";
ALTER TABLE "certifications" DROP CONSTRAINT IF EXISTS "certifications_workerId_fkey";
ALTER TABLE "worker_documents" DROP CONSTRAINT IF EXISTS "worker_documents_workerId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "worker_skills";
DROP TABLE IF EXISTS "certifications";
DROP TABLE IF EXISTS "worker_documents";

-- Drop enums
DROP TYPE IF EXISTS "SkillLevel";
DROP TYPE IF EXISTS "DocumentType";

-- Revert worker_profiles table changes
ALTER TABLE "worker_profiles" 
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "yearsOfExperience",
  DROP COLUMN IF EXISTS "contactEmail",
  DROP COLUMN IF EXISTS "contactPhone",
  DROP COLUMN IF EXISTS "preferredContactMethod",
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "city",
  DROP COLUMN IF EXISTS "state",
  DROP COLUMN IF EXISTS "zipCode";
