/*
  Warnings:

  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- Disable foreign key checks
PRAGMA foreign_keys=OFF;

-- Create a new table with the updated schema
CREATE TABLE "ChatMessage_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatSessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") 
      REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "ChatMessage_new" 
("id", "chatSessionId", "role", "content", "llmProvider", "llmModel", "createdAt", "updatedAt")
SELECT "id", "chatSessionId", "role", "content", "llmProvider", "llmModel", "createdAt", "createdAt" AS "updatedAt"
FROM "ChatMessage";

-- Drop the old table
DROP TABLE "ChatMessage";

-- Rename the new table to the original name
ALTER TABLE "ChatMessage_new" RENAME TO "ChatMessage";

-- Re-enable foreign key checks
PRAGMA foreign_keys=ON;
