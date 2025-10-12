-- Enhanced Job Posting System Migration
-- This migration adds support for user stories:
-- - Job types (single shift, weekly, permanent)
-- - Skill requirements with levels
-- - Detailed compensation structure
-- - Benefits and perks

-- Add job type and enhanced fields to Job table
ALTER TABLE "jobs" 
ADD COLUMN "jobType" TEXT NOT NULL DEFAULT 'SINGLE_SHIFT',
ADD COLUMN "skillLevel" TEXT NOT NULL DEFAULT 'NO_EXPERIENCE', 
ADD COLUMN "skillRequirements" JSONB,
ADD COLUMN "certificationRequirements" TEXT[],
ADD COLUMN "benefits" JSONB,
ADD COLUMN "weeklyHours" INTEGER,
ADD COLUMN "shiftStartTime" TIME,
ADD COLUMN "shiftEndTime" TIME,
ADD COLUMN "workDays" TEXT[],
ADD COLUMN "staffMealsIncluded" BOOLEAN DEFAULT false,
ADD COLUMN "tipsIncluded" BOOLEAN DEFAULT false,
ADD COLUMN "uniformProvided" BOOLEAN DEFAULT false,
ADD COLUMN "parkingAvailable" BOOLEAN DEFAULT false,
ADD COLUMN "transportationAssistance" BOOLEAN DEFAULT false,
ADD COLUMN "location" JSONB,
ADD COLUMN "urgency" TEXT DEFAULT 'NORMAL',
ADD COLUMN "experienceRequired" TEXT,
ADD COLUMN "physicalRequirements" TEXT[];

-- Create enum types for job type, skill level, and urgency
CREATE TYPE "JobType" AS ENUM ('SINGLE_SHIFT', 'WEEKLY_SHORT_TERM', 'PERMANENT');
CREATE TYPE "SkillLevel" AS ENUM ('NO_EXPERIENCE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "JobUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- Update the columns to use proper enum types
ALTER TABLE "jobs" 
ALTER COLUMN "jobType" TYPE "JobType" USING "jobType"::"JobType",
ALTER COLUMN "skillLevel" TYPE "SkillLevel" USING "skillLevel"::"SkillLevel",
ALTER COLUMN "urgency" TYPE "JobUrgency" USING "urgency"::"JobUrgency";