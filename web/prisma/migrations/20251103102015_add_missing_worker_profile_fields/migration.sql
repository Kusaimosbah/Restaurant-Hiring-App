/*
  Warnings:

  - The values [MENU] on the enum `PhotoType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `message` on the `applications` table. All the data in the column will be lost.
  - The `status` column on the `applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `email_verification_tokens` table. All the data in the column will be lost.
  - The `status` column on the `jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `email` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `isMainLocation` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `password_reset_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `password_reset_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `password_reset_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `password_reset_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revoked` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the `availability_slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboarding_documents` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conversationId` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'CERTIFICATE', 'ID', 'WORK_PERMIT', 'REFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_STATUS', 'NEW_APPLICATION', 'NEW_MESSAGE', 'NEW_JOB', 'SHIFT_REMINDER', 'SHIFT_ASSIGNED', 'PAYMENT_UPDATE', 'NEW_REVIEW', 'SYSTEM_ALERT', 'PROFILE_VIEW');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'EMOJI_ONLY');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'APPLICATION_THREAD', 'JOB_DISCUSSION', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('VIDEO', 'DOCUMENT', 'QUIZ', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING', 'PENDING_AUTH');

-- CreateEnum
CREATE TYPE "SyncFrequency" AS ENUM ('REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL');

-- CreateEnum
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "HiringMetricType" AS ENUM ('TIME_TO_FILL', 'COST_PER_HIRE', 'APPLICATION_VOLUME', 'CONVERSION_RATE', 'QUALITY_SCORE', 'RETENTION_RATE', 'SOURCING_EFFECTIVENESS', 'CANDIDATE_EXPERIENCE', 'INTERVIEW_EFFICIENCY', 'OFFER_ACCEPTANCE_RATE');

-- CreateEnum
CREATE TYPE "MetricPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'JOB_VIEW', 'JOB_APPLICATION', 'MESSAGE_SENT', 'PROFILE_UPDATE', 'SEARCH_PERFORMED', 'FILTER_APPLIED', 'REPORT_GENERATED', 'INTEGRATION_SYNC', 'NOTIFICATION_CLICKED', 'FILE_UPLOAD', 'SKILL_ASSESSMENT', 'TRAINING_COMPLETION');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('HIRING_OVERVIEW', 'COST_ANALYSIS', 'PERFORMANCE_TRENDS', 'CANDIDATE_PIPELINE', 'SOURCE_EFFECTIVENESS', 'TIME_TO_FILL_ANALYSIS', 'QUALITY_METRICS', 'COMPETITIVE_ANALYSIS', 'FORECASTING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_SUCCESS', 'TWO_FACTOR_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SUSPICIOUS_ACTIVITY', 'DATA_EXPORT', 'DATA_DELETION', 'PERMISSION_CHANGED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'SHARE', 'DOWNLOAD');

-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('PERSONAL_INFO', 'APPLICATION_DATA', 'COMMUNICATION_DATA', 'USAGE_DATA', 'ALL_DATA');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FAILED_LOGIN_ATTEMPTS', 'SUSPICIOUS_LOCATION', 'DATA_BREACH', 'UNAUTHORIZED_ACCESS', 'POLICY_VIOLATION', 'SYSTEM_VULNERABILITY');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "PhotoType_new" AS ENUM ('LOGO', 'EXTERIOR', 'INTERIOR', 'FOOD', 'STAFF', 'OTHER');
ALTER TABLE "public"."restaurant_photos" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "restaurant_photos" ALTER COLUMN "type" TYPE "PhotoType_new" USING ("type"::text::"PhotoType_new");
ALTER TYPE "PhotoType" RENAME TO "PhotoType_old";
ALTER TYPE "PhotoType_new" RENAME TO "PhotoType";
DROP TYPE "public"."PhotoType_old";
ALTER TABLE "restaurant_photos" ALTER COLUMN "type" SET DEFAULT 'INTERIOR';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "public"."availability_slots" DROP CONSTRAINT "availability_slots_workerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."onboarding_documents" DROP CONSTRAINT "onboarding_documents_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."restaurants" DROP CONSTRAINT "restaurants_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."worker_profiles" DROP CONSTRAINT "worker_profiles_userId_fkey";

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "country" DROP DEFAULT;

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "message",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "email_verification_tokens" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "used",
DROP COLUMN "usedAt";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "email",
DROP COLUMN "isMainLocation",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "receiverId",
ADD COLUMN     "conversationId" TEXT NOT NULL,
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "replyToId" TEXT;

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "used",
DROP COLUMN "usedAt";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "revoked",
DROP COLUMN "revokedAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "worker_profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "lastRecommendationRefresh" TIMESTAMP(3),
ADD COLUMN     "preferredContactMethod" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER,
ADD COLUMN     "zipCode" TEXT;

-- DropTable
DROP TABLE "public"."availability_slots";

-- DropTable
DROP TABLE "public"."onboarding_documents";

-- DropEnum
DROP TYPE "public"."ApplicationStatus";

-- DropEnum
DROP TYPE "public"."JobStatus";

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "workerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT,
    "jobId" TEXT,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mutedUntil" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typing_indicators" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT true,
    "lastTypingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "applicationUpdates" BOOLEAN NOT NULL DEFAULT true,
    "messages" BOOLEAN NOT NULL DEFAULT true,
    "jobPostings" BOOLEAN NOT NULL DEFAULT true,
    "shiftReminders" BOOLEAN NOT NULL DEFAULT true,
    "reviewsAndRatings" BOOLEAN NOT NULL DEFAULT true,
    "paymentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "targetRole" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastExecuted" TIMESTAMP(3),
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING_AUTH',
    "config" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "syncFrequency" "SyncFrequency" NOT NULL DEFAULT 'DAILY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_syncs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" "IntegrationSyncStatus" NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "duration" INTEGER NOT NULL,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matches" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "skillScore" DOUBLE PRECISION NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "locationScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "salaryScore" DOUBLE PRECISION NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_matches" (
    "id" TEXT NOT NULL,
    "jobMatchId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "requiredLevel" TEXT,
    "workerLevel" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matching_logs" (
    "id" TEXT NOT NULL,
    "jobMatchId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "oldScore" DOUBLE PRECISION,
    "newScore" DOUBLE PRECISION,
    "changes" JSONB,
    "triggerReason" TEXT,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_matching_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirements" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "requiredLevel" "SkillLevel" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "yearsExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_preferences" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "minHourlyRate" DOUBLE PRECISION,
    "maxHourlyRate" DOUBLE PRECISION,
    "preferredRadius" INTEGER,
    "availableDays" TEXT[],
    "availableTimeSlots" JSONB,
    "workEnvironmentPref" TEXT[],
    "shiftLengthPref" TEXT,
    "transportationAccess" BOOLEAN NOT NULL DEFAULT true,
    "willingToTravel" BOOLEAN NOT NULL DEFAULT false,
    "notificationSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_metrics" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "metricType" "HiringMetricType" NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "period" "MetricPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_analytics" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "viewDuration" INTEGER,
    "stageTransitions" JSONB,
    "responseTime" INTEGER,
    "timeToHire" INTEGER,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "sourceChannel" TEXT,
    "deviceInfo" JSONB,
    "locationData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_analytics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "averageTimeToApply" INTEGER,
    "topSkillsRequested" TEXT[],
    "averageHourlyRate" DOUBLE PRECISION,
    "competitionScore" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "sourceBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "UserActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reports" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedBy" TEXT,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_analyses" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "period" "MetricPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalHiringCost" DOUBLE PRECISION NOT NULL,
    "costPerHire" DOUBLE PRECISION NOT NULL,
    "costPerApplication" DOUBLE PRECISION NOT NULL,
    "advertisingCost" DOUBLE PRECISION NOT NULL,
    "screeningCost" DOUBLE PRECISION NOT NULL,
    "interviewCost" DOUBLE PRECISION NOT NULL,
    "onboardingCost" DOUBLE PRECISION NOT NULL,
    "agencyCost" DOUBLE PRECISION NOT NULL,
    "platformCost" DOUBLE PRECISION NOT NULL,
    "timeToFill" DOUBLE PRECISION NOT NULL,
    "sourceEfficiency" JSONB NOT NULL,
    "stageConversion" JSONB NOT NULL,
    "qualityMetrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_data" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "dataSource" TEXT NOT NULL,
    "period" "MetricPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_auth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" "SecurityEventType" NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "risk" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "conditions" JSONB,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL,
    "retentionDate" TIMESTAMP(3) NOT NULL,
    "status" "RetentionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "data_retention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_calculations" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "skillsScore" DOUBLE PRECISION NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "locationScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "salaryScore" DOUBLE PRECISION NOT NULL,
    "cultureScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "calculatedBy" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_invitations" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "job_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_skills" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModulePrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModulePrerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "certifications_workerProfileId_idx" ON "certifications"("workerProfileId");

-- CreateIndex
CREATE INDEX "worker_documents_workerProfileId_idx" ON "worker_documents"("workerProfileId");

-- CreateIndex
CREATE INDEX "conversations_applicationId_idx" ON "conversations"("applicationId");

-- CreateIndex
CREATE INDEX "conversations_jobId_idx" ON "conversations"("jobId");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "typing_indicators_conversationId_idx" ON "typing_indicators"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "typing_indicators_conversationId_userId_key" ON "typing_indicators"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_devices_token_key" ON "notification_devices"("token");

-- CreateIndex
CREATE INDEX "notification_devices_userId_idx" ON "notification_devices"("userId");

-- CreateIndex
CREATE INDEX "training_materials_moduleId_idx" ON "training_materials"("moduleId");

-- CreateIndex
CREATE INDEX "training_progress_userId_idx" ON "training_progress"("userId");

-- CreateIndex
CREATE INDEX "training_progress_materialId_idx" ON "training_progress"("materialId");

-- CreateIndex
CREATE INDEX "training_progress_moduleId_idx" ON "training_progress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_userId_materialId_key" ON "training_progress"("userId", "materialId");

-- CreateIndex
CREATE INDEX "job_matches_jobId_idx" ON "job_matches"("jobId");

-- CreateIndex
CREATE INDEX "job_matches_workerId_idx" ON "job_matches"("workerId");

-- CreateIndex
CREATE INDEX "job_matches_overallScore_idx" ON "job_matches"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "job_matches_jobId_workerId_key" ON "job_matches"("jobId", "workerId");

-- CreateIndex
CREATE INDEX "skill_matches_jobMatchId_idx" ON "skill_matches"("jobMatchId");

-- CreateIndex
CREATE INDEX "job_matching_logs_jobMatchId_idx" ON "job_matching_logs"("jobMatchId");

-- CreateIndex
CREATE INDEX "job_matching_logs_createdAt_idx" ON "job_matching_logs"("createdAt");

-- CreateIndex
CREATE INDEX "job_requirements_jobId_idx" ON "job_requirements"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "worker_preferences_workerId_key" ON "worker_preferences"("workerId");

-- CreateIndex
CREATE INDEX "hiring_metrics_restaurantId_metricType_idx" ON "hiring_metrics"("restaurantId", "metricType");

-- CreateIndex
CREATE INDEX "hiring_metrics_periodStart_periodEnd_idx" ON "hiring_metrics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "application_analytics_applicationId_key" ON "application_analytics"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "job_analytics_jobId_key" ON "job_analytics"("jobId");

-- CreateIndex
CREATE INDEX "user_activities_userId_activityType_idx" ON "user_activities"("userId", "activityType");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "user_activities"("createdAt");

-- CreateIndex
CREATE INDEX "performance_reports_restaurantId_reportType_idx" ON "performance_reports"("restaurantId", "reportType");

-- CreateIndex
CREATE INDEX "performance_reports_createdAt_idx" ON "performance_reports"("createdAt");

-- CreateIndex
CREATE INDEX "cost_analyses_restaurantId_period_idx" ON "cost_analyses"("restaurantId", "period");

-- CreateIndex
CREATE INDEX "benchmark_data_industry_region_companySize_idx" ON "benchmark_data"("industry", "region", "companySize");

-- CreateIndex
CREATE INDEX "benchmark_data_metricType_metricName_idx" ON "benchmark_data"("metricType", "metricName");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_auth_userId_key" ON "two_factor_auth"("userId");

-- CreateIndex
CREATE INDEX "security_logs_userId_timestamp_idx" ON "security_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "security_logs_event_timestamp_idx" ON "security_logs"("event", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleName_permission_resource_key" ON "role_permissions"("roleName", "permission", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_isActive_idx" ON "user_sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_userId_key" ON "data_retention"("userId");

-- CreateIndex
CREATE INDEX "data_retention_retentionDate_status_idx" ON "data_retention"("retentionDate", "status");

-- CreateIndex
CREATE INDEX "security_alerts_userId_isResolved_idx" ON "security_alerts"("userId", "isResolved");

-- CreateIndex
CREATE INDEX "security_alerts_alertType_severity_idx" ON "security_alerts"("alertType", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "match_calculations_jobId_workerId_calculatedAt_key" ON "match_calculations"("jobId", "workerId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_invitations_jobId_workerId_key" ON "job_invitations"("jobId", "workerId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "worker_skills_workerProfileId_skillId_key" ON "worker_skills"("workerProfileId", "skillId");

-- CreateIndex
CREATE INDEX "_ModulePrerequisites_B_index" ON "_ModulePrerequisites"("B");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_recipientId_idx" ON "messages"("recipientId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "messages"("isRead");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_devices" ADD CONSTRAINT "notification_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_materials" ADD CONSTRAINT "training_materials_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_syncs" ADD CONSTRAINT "integration_syncs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_matches" ADD CONSTRAINT "skill_matches_jobMatchId_fkey" FOREIGN KEY ("jobMatchId") REFERENCES "job_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matching_logs" ADD CONSTRAINT "job_matching_logs_jobMatchId_fkey" FOREIGN KEY ("jobMatchId") REFERENCES "job_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_preferences" ADD CONSTRAINT "worker_preferences_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_metrics" ADD CONSTRAINT "hiring_metrics_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_analytics" ADD CONSTRAINT "application_analytics_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_analytics" ADD CONSTRAINT "job_analytics_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reports" ADD CONSTRAINT "performance_reports_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_analyses" ADD CONSTRAINT "cost_analyses_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_auth" ADD CONSTRAINT "two_factor_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_retention" ADD CONSTRAINT "data_retention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_calculations" ADD CONSTRAINT "match_calculations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_calculations" ADD CONSTRAINT "match_calculations_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_calculations" ADD CONSTRAINT "match_calculations_calculatedBy_fkey" FOREIGN KEY ("calculatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModulePrerequisites" ADD CONSTRAINT "_ModulePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModulePrerequisites" ADD CONSTRAINT "_ModulePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
