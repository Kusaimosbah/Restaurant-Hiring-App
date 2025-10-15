-- Drop foreign keys first
ALTER TABLE "training_materials" DROP CONSTRAINT IF EXISTS "training_materials_moduleId_fkey";
ALTER TABLE "training_progress" DROP CONSTRAINT IF EXISTS "training_progress_userId_fkey";
ALTER TABLE "training_progress" DROP CONSTRAINT IF EXISTS "training_progress_materialId_fkey";
ALTER TABLE "training_progress" DROP CONSTRAINT IF EXISTS "training_progress_moduleId_fkey";
ALTER TABLE "_ModulePrerequisites" DROP CONSTRAINT IF EXISTS "_ModulePrerequisites_A_fkey";
ALTER TABLE "_ModulePrerequisites" DROP CONSTRAINT IF EXISTS "_ModulePrerequisites_B_fkey";

-- Drop tables
DROP TABLE IF EXISTS "training_progress";
DROP TABLE IF EXISTS "training_materials";
DROP TABLE IF EXISTS "training_modules";
DROP TABLE IF EXISTS "_ModulePrerequisites";

-- Drop enums
DROP TYPE IF EXISTS "MaterialType";
DROP TYPE IF EXISTS "ProgressStatus";
