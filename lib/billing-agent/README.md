# Billing Agent Module

## Overview
The Billing Agent module is responsible for handling healthcare billing operations in the For Your Health MVP application. It processes various billing-related tasks asynchronously using a priority queue system with retry capabilities.

## Key Components

### SimplifiedBillingAgent
The main agent class that manages the task queue and processes tasks. It follows a singleton pattern to ensure only one instance is running at a time.

Key features:
- Task queue management with priority handling
- Exponential backoff for failed tasks
- Asynchronous task processing
- Database integration via Prisma ORM
- Knowledge tracking for improved task processing

### Task Processors
Specialized functions for handling different types of billing tasks:
- `processCreateClaimTask`: Creates new claims in the system
- `processCheckEligibilityTask`: Verifies patient eligibility with insurance
- `processGenerateEdiTask`: Generates EDI files for claim submission
- `processSubmitClaimTask`: Submits claims to clearinghouses
- `processCheckStatusTask`: Checks status of submitted claims
- `processFileAppealTask`: Handles appeals for denied claims

## Technical Details
- TypeScript with ES2015 target for compatibility with Prisma client
- Integration with Prisma ORM for database operations
- Task retry logic with exponential backoff
- Knowledge tracking for improved processing

## Compilation
A dedicated TypeScript configuration is provided for compiling this module:
```
npx tsc -p billing-agent-tsconfig.json
```

Or use the provided script:
```
node compile-billing-agent.mjs
```

## HIPAA Compliance
This module handles sensitive healthcare data and is designed with HIPAA compliance in mind. Future enhancements will include additional security measures for production deployment.
