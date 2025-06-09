/*
  Warnings:

  - You are about to drop the column `isActive` on the `InsurancePlan` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `InsurancePlan` table. All the data in the column will be lost.
  - You are about to drop the column `planType` on the `InsurancePlan` table. All the data in the column will be lost.
  - You are about to drop the column `termDate` on the `InsurancePlan` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ClaimDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reportId" TEXT,
    "insurancePlanId" TEXT,
    "draftName" TEXT,
    "draftData" JSONB NOT NULL,
    "pdfParseConfidence" REAL,
    "pdfParseResults" JSONB,
    "lastEditedSection" TEXT,
    "completedSections" JSONB,
    "validationErrors" JSONB,
    "biomarkers" JSONB,
    "patientFirstName" TEXT,
    "patientLastName" TEXT,
    "patientDOB" DATETIME,
    "patientGender" TEXT,
    "patientAddress" TEXT,
    "patientCity" TEXT,
    "patientState" TEXT,
    "patientZip" TEXT,
    "patientPhone" TEXT,
    "providerName" TEXT,
    "providerNPI" TEXT,
    "providerTaxId" TEXT,
    "providerAddress" TEXT,
    "providerCity" TEXT,
    "providerState" TEXT,
    "providerZip" TEXT,
    "specimenId" TEXT,
    "collectionDate" DATETIME,
    "receivedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastAutoSave" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClaimDraft_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClaimDraft_insurancePlanId_fkey" FOREIGN KEY ("insurancePlanId") REFERENCES "InsurancePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "placeOfService" TEXT,
    "priorAuthNumber" TEXT,
    "referralNumber" TEXT,
    "admissionDate" DATETIME,
    "dischargeDate" DATETIME,
    "patientAccountNum" TEXT,
    "acceptAssignment" BOOLEAN NOT NULL DEFAULT true,
    "totalCoinsurance" REAL,
    "totalDeductible" REAL,
    "renderingProviderNPI" TEXT,
    "referringProviderNPI" TEXT,
    "facilityNPI" TEXT,
    "medicalRecordNumber" TEXT,
    "ediValidatedAt" DATETIME,
    "ediValidationErrors" JSONB,
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
CREATE TABLE "new_InsurancePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "planName" TEXT,
    "memberId" TEXT NOT NULL,
    "groupNumber" TEXT,
    "subscriberName" TEXT,
    "subscriberDOB" DATETIME,
    "relationToInsured" TEXT NOT NULL DEFAULT 'self',
    "effectiveDate" DATETIME,
    "expirationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsurancePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InsurancePlan" ("createdAt", "effectiveDate", "groupNumber", "id", "memberId", "payerId", "payerName", "updatedAt", "userId") SELECT "createdAt", "effectiveDate", "groupNumber", "id", "memberId", "payerId", "payerName", "updatedAt", "userId" FROM "InsurancePlan";
DROP TABLE "InsurancePlan";
ALTER TABLE "new_InsurancePlan" RENAME TO "InsurancePlan";
CREATE INDEX "InsurancePlan_userId_idx" ON "InsurancePlan"("userId");
CREATE INDEX "InsurancePlan_memberId_idx" ON "InsurancePlan"("memberId");
CREATE INDEX "InsurancePlan_payerId_idx" ON "InsurancePlan"("payerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClaimDraft_userId_idx" ON "ClaimDraft"("userId");

-- CreateIndex
CREATE INDEX "ClaimDraft_reportId_idx" ON "ClaimDraft"("reportId");
