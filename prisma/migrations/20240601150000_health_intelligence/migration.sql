-- Add new models for health intelligence
CREATE TABLE "HealthMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DNASequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rsid" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "genotype" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MicrobiomeSample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sampleDate" DATETIME NOT NULL,
    "sampleType" TEXT NOT NULL,
    "diversityScore" FLOAT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MicrobiomeOrganism" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxaLevel" TEXT NOT NULL,
    "abundance" FLOAT NOT NULL,
    "relativeAbundance" FLOAT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sampleId") REFERENCES "MicrobiomeSample" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX "HealthMetric_userId_idx" ON "HealthMetric"("userId");
CREATE INDEX "HealthMetric_type_idx" ON "HealthMetric"("type");
CREATE INDEX "HealthMetric_date_idx" ON "HealthMetric"("date");
CREATE INDEX "DNASequence_userId_idx" ON "DNASequence"("userId");
CREATE INDEX "DNASequence_rsid_idx" ON "DNASequence"("rsid");
CREATE INDEX "MicrobiomeSample_userId_idx" ON "MicrobiomeSample"("userId");
