-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WorkerOffer" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "offeredRate" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "agreedHourlyRate" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 50,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_serviceRequestId_key" ON "Assignment"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "WorkerOffer" ADD CONSTRAINT "WorkerOffer_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerOffer" ADD CONSTRAINT "WorkerOffer_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
