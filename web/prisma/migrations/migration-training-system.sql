-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('VIDEO', 'DOCUMENT', 'QUIZ', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

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
CREATE TABLE "_ModulePrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "training_materials_moduleId_idx" ON "training_materials"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_userId_materialId_key" ON "training_progress"("userId", "materialId");

-- CreateIndex
CREATE INDEX "training_progress_userId_idx" ON "training_progress"("userId");

-- CreateIndex
CREATE INDEX "training_progress_materialId_idx" ON "training_progress"("materialId");

-- CreateIndex
CREATE INDEX "training_progress_moduleId_idx" ON "training_progress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "_ModulePrerequisites_AB_unique" ON "_ModulePrerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_ModulePrerequisites_B_index" ON "_ModulePrerequisites"("B");

-- AddForeignKey
ALTER TABLE "training_materials" ADD CONSTRAINT "training_materials_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModulePrerequisites" ADD CONSTRAINT "_ModulePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModulePrerequisites" ADD CONSTRAINT "_ModulePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
