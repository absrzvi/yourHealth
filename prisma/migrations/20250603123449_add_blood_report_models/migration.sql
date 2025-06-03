-- CreateTable
CREATE TABLE "BloodTestReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "labName" TEXT,
    "doctorName" TEXT,
    "reportIdentifier" TEXT,
    "reportVersion" INTEGER NOT NULL DEFAULT 1,
    "patientName" TEXT,
    "patientDOB" DATETIME,
    "patientGender" TEXT,
    "patientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "originalReportId" TEXT,
    "rawOcrText" TEXT,
    "ocrConfidence" REAL,
    "parsingMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BloodTestReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BloodTestReport_originalReportId_fkey" FOREIGN KEY ("originalReportId") REFERENCES "BloodTestReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BloodBiomarker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "value" TEXT NOT NULL,
    "numericValue" REAL,
    "unit" TEXT,
    "referenceRangeLow" REAL,
    "referenceRangeHigh" REAL,
    "referenceRangeText" TEXT,
    "category" TEXT,
    "isAbnormal" BOOLEAN,
    "abnormalityType" TEXT,
    "clinicalSignificance" TEXT,
    "confidence" REAL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BloodBiomarker_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "BloodTestReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BloodReportSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sectionText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BloodReportSection_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "BloodTestReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BloodTestReport_userId_idx" ON "BloodTestReport"("userId");

-- CreateIndex
CREATE INDEX "BloodTestReport_reportDate_idx" ON "BloodTestReport"("reportDate");

-- CreateIndex
CREATE INDEX "BloodTestReport_status_idx" ON "BloodTestReport"("status");

-- CreateIndex
CREATE INDEX "BloodBiomarker_reportId_idx" ON "BloodBiomarker"("reportId");

-- CreateIndex
CREATE INDEX "BloodBiomarker_name_idx" ON "BloodBiomarker"("name");

-- CreateIndex
CREATE INDEX "BloodBiomarker_category_idx" ON "BloodBiomarker"("category");

-- CreateIndex
CREATE INDEX "BloodBiomarker_isAbnormal_idx" ON "BloodBiomarker"("isAbnormal");

-- CreateIndex
CREATE INDEX "BloodReportSection_reportId_idx" ON "BloodReportSection"("reportId");
