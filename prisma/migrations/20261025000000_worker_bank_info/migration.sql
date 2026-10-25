-- CreateTable
CREATE TABLE "WorkerBankInfo" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumberEncrypted" TEXT NOT NULL,
    "accountNumberLast4" VARCHAR(4) NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerBankInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerBankInfo_workerId_key" ON "WorkerBankInfo"("workerId");

-- AddForeignKey
ALTER TABLE "WorkerBankInfo" ADD CONSTRAINT "WorkerBankInfo_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;