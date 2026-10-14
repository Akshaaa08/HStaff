-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('INSTANT', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'REQUESTED', 'ACCEPTED', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "bookingMode" "BookingMode" NOT NULL DEFAULT 'INSTANT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL DEFAULT 1,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
