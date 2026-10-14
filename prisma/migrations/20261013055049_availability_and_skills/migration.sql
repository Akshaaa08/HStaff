-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "skillIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- CreateTable
CREATE TABLE "WorkerAvailability" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerAvailability_workerId_idx" ON "WorkerAvailability"("workerId");

-- AddForeignKey
ALTER TABLE "WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
