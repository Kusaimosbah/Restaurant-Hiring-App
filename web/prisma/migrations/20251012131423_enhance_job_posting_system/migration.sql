-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('SINGLE_SHIFT', 'WEEKLY_SHORT_TERM', 'PERMANENT');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('NO_EXPERIENCE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "JobUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "benefits" JSONB,
ADD COLUMN     "certificationRequirements" TEXT[],
ADD COLUMN     "experienceRequired" TEXT,
ADD COLUMN     "jobType" "JobType" NOT NULL DEFAULT 'SINGLE_SHIFT',
ADD COLUMN     "location" JSONB,
ADD COLUMN     "parkingAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "physicalRequirements" TEXT[],
ADD COLUMN     "shiftEndTime" TEXT,
ADD COLUMN     "shiftStartTime" TEXT,
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL DEFAULT 'NO_EXPERIENCE',
ADD COLUMN     "skillRequirements" JSONB,
ADD COLUMN     "staffMealsIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipsIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportationAssistance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uniformProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urgency" "JobUrgency" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "weeklyHours" INTEGER,
ADD COLUMN     "workDays" TEXT[];
