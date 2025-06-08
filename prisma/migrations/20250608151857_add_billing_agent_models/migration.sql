-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "result" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentKnowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AgentTask_taskType_idx" ON "AgentTask"("taskType");

-- CreateIndex
CREATE INDEX "AgentTask_entityId_idx" ON "AgentTask"("entityId");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE INDEX "AgentTask_priority_idx" ON "AgentTask"("priority");

-- CreateIndex
CREATE INDEX "AgentTask_scheduledFor_idx" ON "AgentTask"("scheduledFor");

-- CreateIndex
CREATE INDEX "AgentKnowledge_category_idx" ON "AgentKnowledge"("category");

-- CreateIndex
CREATE INDEX "AgentKnowledge_payerId_idx" ON "AgentKnowledge"("payerId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentKnowledge_category_payerId_key" ON "AgentKnowledge"("category", "payerId");
