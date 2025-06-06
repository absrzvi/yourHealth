/*
  Warnings:

  - You are about to drop the column `claimId` on the `DenialPattern` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `DenialPattern` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `DenialPattern` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `DenialPattern` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EligibilityCheck` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `EligibilityCheck` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EligibilityCheck` table. All the data in the column will be lost.
  - Added the required column `denialCode` to the `DenialPattern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `denialReason` to the `DenialPattern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastOccurred` to the `DenialPattern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payerId` to the `DenialPattern` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DenialPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payerId" TEXT NOT NULL,
    "denialCode" TEXT NOT NULL,
    "denialReason" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "lastOccurred" DATETIME NOT NULL,
    "preventionRule" JSONB
);
INSERT INTO "new_DenialPattern" ("id") SELECT "id" FROM "DenialPattern";
DROP TABLE "DenialPattern";
ALTER TABLE "new_DenialPattern" RENAME TO "DenialPattern";
CREATE TABLE "new_EligibilityCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insurancePlanId" TEXT NOT NULL,
    "claimId" TEXT,
    "status" TEXT NOT NULL,
    "deductible" REAL,
    "deductibleMet" REAL,
    "outOfPocketMax" REAL,
    "outOfPocketMet" REAL,
    "copay" REAL,
    "coinsurance" REAL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseData" JSONB,
    CONSTRAINT "EligibilityCheck_insurancePlanId_fkey" FOREIGN KEY ("insurancePlanId") REFERENCES "InsurancePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EligibilityCheck_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EligibilityCheck" ("claimId", "id", "insurancePlanId", "status") SELECT "claimId", "id", "insurancePlanId", "status" FROM "EligibilityCheck";
DROP TABLE "EligibilityCheck";
ALTER TABLE "new_EligibilityCheck" RENAME TO "EligibilityCheck";
CREATE UNIQUE INDEX "EligibilityCheck_claimId_key" ON "EligibilityCheck"("claimId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
