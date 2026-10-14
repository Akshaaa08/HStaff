-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'SETTLED';

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_respondentId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_rateeId_fkey";

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "tags" TEXT[];

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_paymentId_key" ON "Payout"("paymentId");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rateeId_fkey" FOREIGN KEY ("rateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
