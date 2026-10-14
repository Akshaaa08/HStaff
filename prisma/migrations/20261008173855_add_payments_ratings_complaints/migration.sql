-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('NO_SHOW', 'POOR_QUALITY', 'OVERCHARGING', 'UNPROFESSIONAL', 'DAMAGED_PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rateeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "complainantId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_timesheetId_key" ON "Payment"("timesheetId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Rating_raterId_idx" ON "Rating"("raterId");

-- CreateIndex
CREATE INDEX "Rating_rateeId_idx" ON "Rating"("rateeId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_assignmentId_raterId_key" ON "Rating"("assignmentId", "raterId");

-- CreateIndex
CREATE INDEX "Complaint_complainantId_idx" ON "Complaint"("complainantId");

-- CreateIndex
CREATE INDEX "Complaint_respondentId_idx" ON "Complaint"("respondentId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rateeId_fkey" FOREIGN KEY ("rateeId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
