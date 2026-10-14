-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'DISPUTED');

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startOtpHash" TEXT,
    "startOtpExpiresAt" TIMESTAMP(3),
    "endOtpHash" TEXT,
    "endOtpExpiresAt" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "verifiedHours" DOUBLE PRECISION NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "grossWorkerAmount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "customerTotal" INTEGER NOT NULL,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_assignmentId_key" ON "AttendanceSession"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_assignmentId_key" ON "Timesheet"("assignmentId");

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
