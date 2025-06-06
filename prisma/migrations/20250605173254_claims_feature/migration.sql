/*
  Warnings:

  - You are about to drop the column `denialPatterns` on the `Claim` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EligibilityCheck_status_idx";

-- DropIndex
DROP INDEX "EligibilityCheck_insurancePlanId_idx";

-- DropIndex
DROP INDEX "DenialPattern_payerId_denialCode_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reportId" TEXT,
    "insurancePlanId" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalCharge" REAL NOT NULL,
    "allowedAmount" REAL,
    "paidAmount" REAL,
    "patientResponsibility" REAL,
    "denialReason" TEXT,
    "submissionDate" DATETIME,
    "processedDate" DATETIME,
    "ediFileLocation" TEXT,
    "clearinghouseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_insurancePlanId_fkey" FOREIGN KEY ("insurancePlanId") REFERENCES "InsurancePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Claim" ("allowedAmount", "claimNumber", "clearinghouseId", "createdAt", "denialReason", "ediFileLocation", "id", "insurancePlanId", "paidAmount", "patientResponsibility", "processedDate", "reportId", "status", "submissionDate", "totalCharge", "updatedAt", "userId") SELECT "allowedAmount", "claimNumber", "clearinghouseId", "createdAt", "denialReason", "ediFileLocation", "id", "insurancePlanId", "paidAmount", "patientResponsibility", "processedDate", "reportId", "status", "submissionDate", "totalCharge", "updatedAt", "userId" FROM "Claim";
DROP TABLE "Claim";
ALTER TABLE "new_Claim" RENAME TO "Claim";
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");
CREATE INDEX "Claim_claimNumber_idx" ON "Claim"("claimNumber");
CREATE INDEX "Claim_status_idx" ON "Claim"("status");
CREATE INDEX "Claim_submissionDate_idx" ON "Claim"("submissionDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
