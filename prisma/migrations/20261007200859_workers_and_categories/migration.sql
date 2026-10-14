-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "baseHourlyRate" INTEGER NOT NULL DEFAULT 0,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerCategory" (
    "workerId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "WorkerCategory_pkey" PRIMARY KEY ("workerId","categoryId")
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "workerId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("workerId","skillId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_categoryId_name_key" ON "Skill"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCategory" ADD CONSTRAINT "WorkerCategory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCategory" ADD CONSTRAINT "WorkerCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
