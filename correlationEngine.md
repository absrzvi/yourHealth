CorrelationEngine MVP Implementation Guide for Windsurf
Project Context
This is an implementation guide for adding a Correlation Engine to an existing Next.js health app. The engine will analyze uploaded health test results to discover biomarker correlations and present them in an intuitive dashboard.
Existing App Structure
/app
  /dashboard/page.tsx
  /ai-coach/page.tsx
  /data-sources/page.tsx (has file upload widget)
  /correlations/page.tsx (placeholder - needs implementation)
  /auth/login/page.tsx
/components
  /layout/Sidebar.tsx
  /layout/Header.tsx
/lib (existing utilities)
Tech Stack

Next.js 14+ with App Router
TypeScript (strict mode)
Prisma ORM
NextAuth.js
Tailwind CSS
Local storage only (no cloud for MVP)


🎯 WINDSURF IMPLEMENTATION PROMPT
Create a modular correlation engine for the existing For Your Health Next.js app that analyzes health test results and discovers biomarker correlations. The implementation should be fully local, type-safe, and seamlessly integrated with the current app structure.
🔒 WINDSURF SAFETY REQUIREMENTS

Use environment variables for ALL configuration
Implement comprehensive input validation using Zod
Add proper error handling with custom exception types
No hardcoded values or sensitive data in code
Use TypeScript strict mode throughout
Implement proper data sanitization for file uploads
Add rate limiting for processing operations
Encrypt sensitive health data in local storage
Validate file types and sizes before processing
Implement secure file handling with sandbox isolation

📝 CODE QUALITY REQUIREMENTS

Add complete TypeScript type definitions
Write JSDoc documentation for all public APIs
Create unit tests for all services (80% coverage minimum)
Follow existing ESLint and Prettier configurations
Implement proper separation of concerns
Use dependency injection for testability
Add comprehensive error messages for users
Include loading and error states for all async operations
Implement proper logging throughout
Follow React best practices and hooks patterns

🏗️ ARCHITECTURE REQUIREMENTS

Create modular, plugin-based architecture
Use repository pattern for data access
Implement service layer for business logic
Add factory pattern for parsers and algorithms
Ensure clean separation from existing code
Design for easy future cloud migration
Use event-driven architecture for processing pipeline
Implement proper state management with React Context
Add proper caching strategies
Ensure all components are reusable

Implementation Plan
Phase 1: Foundation & Data Models
Create the following project structure:
/app/correlations/
  /components/
    CorrelationDashboard.tsx
    CorrelationCard.tsx
    CorrelationDetails.tsx
    CorrelationFilters.tsx
    CorrelationChart.tsx
    CorrelationInsights.tsx
  /hooks/
    useCorrelations.ts
    useCorrelationFilters.ts
  /page.tsx

/lib/correlation-engine/
  /types/
    index.ts
    biomarker.types.ts
    correlation.types.ts
    test-result.types.ts
  /schemas/
    biomarker.schema.ts
    correlation.schema.ts
    test-result.schema.ts
  /parsers/
    base.parser.ts
    csv.parser.ts
    pdf.parser.ts
    parser.factory.ts
    parser.types.ts
  /services/
    correlation.service.ts
    biomarker.service.ts
    storage.service.ts
    parser.service.ts
    insight.service.ts
  /algorithms/
    pearson.correlation.ts
    spearman.correlation.ts
    significance.testing.ts
    multiple.testing.ts
  /utils/
    data.normalizer.ts
    unit.converter.ts
    validation.utils.ts
    encryption.utils.ts
    statistics.utils.ts
  /store/
    local.storage.adapter.ts
    indexed.db.adapter.ts
    storage.interface.ts
    data.repository.ts
  /constants/
    biomarker.constants.ts
    medical.ranges.ts
    unit.mappings.ts
Data Models with Zod Schemas
typescript// biomarker.types.ts
export interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    optimalMin?: number;
    optimalMax?: number;
  };
  category: 'hormone' | 'vitamin' | 'mineral' | 'metabolic' | 'genetic' | 'inflammatory';
  testDate: Date;
  labName?: string;
  confidence: number; // 0-1 extraction confidence
  flags?: string[];
}

// correlation.types.ts
export interface Correlation {
  id: string;
  biomarkerA: BiomarkerReference;
  biomarkerB: BiomarkerReference;
  coefficient: number;
  pValue: number;
  confidence: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  sampleSize: number;
  significance: boolean;
  insight?: CorrelationInsight;
}

// test-result.types.ts
export interface TestResult {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'csv' | 'json';
  uploadDate: Date;
  processedDate?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  biomarkers: Biomarker[];
  metadata: {
    labName?: string;
    testType?: string;
    originalFileName: string;
    fileSize: number;
    processingTime?: number;
  };
  errors?: ProcessingError[];
}
Key Services to Implement

StorageService - Handle all local data persistence with encryption
ParserService - Extract biomarkers from uploaded files
CorrelationService - Calculate statistical correlations
InsightService - Generate human-readable insights
BiomarkerService - Normalize and validate biomarker data

Parser Implementation Requirements
Support these common lab formats:

Generic CSV with headers
LabCorp PDF format
Quest Diagnostics PDF format
JSON export format

Include intelligent extraction for:

Complete Blood Count (CBC)
Comprehensive Metabolic Panel (CMP)
Lipid Panel
Hormone Panels
Vitamin/Mineral Panels
Inflammatory Markers

Correlation Analysis Features

Statistical Methods

Pearson correlation for linear relationships
Spearman correlation for non-linear relationships
Partial correlations controlling for age/sex
Multiple testing correction (Benjamini-Hochberg)


Filtering & Ranking

Filter by correlation strength (weak/moderate/strong)
Filter by significance (p < 0.05)
Filter by biomarker category
Sort by coefficient, p-value, or confidence


Insights Generation

Template-based explanations
Medical context when available
Actionability scores
Appropriate disclaimers



UI Components Requirements

CorrelationDashboard

Summary statistics card
Top 10 strongest correlations
Interactive correlation matrix heatmap
Category breakdown pie chart


CorrelationCard

Biomarker names and values
Correlation strength indicator
Significance badge
Quick insight preview
"View Details" action


CorrelationDetails

Scatter plot with trend line
Statistical details table
Full insight explanation
Related correlations
Export options


CorrelationFilters

Multi-select category filter
Strength threshold slider
Significance toggle
Search by biomarker name
Date range selector



Integration Points

Data Sources Page Integration
typescript// In data-sources upload handler
const handleFileUpload = async (file: File) => {
  // Existing upload logic
  
  // Trigger correlation engine processing
  await processTestResult(file);
};

Navigation Update

Update correlation menu item to show badge with result count
Add loading indicator during processing


State Management

Use React Context for correlation state
Integrate with existing auth context for user identification



Error Handling Requirements
Handle these error cases gracefully:

Unsupported file format
Corrupted or malformed files
No biomarkers found in file
Insufficient data for correlations (< 2 biomarkers)
Storage quota exceeded
Parser timeout (> 30 seconds)
Invalid biomarker values

Security Implementation

Data Encryption

Use Web Crypto API for client-side encryption
Encrypt biomarker values and personal identifiers
Store encryption keys in separate IndexedDB store


Input Validation

File type whitelist (pdf, csv, json only)
File size limit (10MB)
Biomarker value range validation
Sanitize all text inputs


Privacy Features

Auto-clear old data (> 90 days)
Export all user data function
Complete data deletion option



Performance Optimization

Processing

Use Web Workers for heavy computations
Implement progressive correlation calculation
Cache correlation results


UI

Virtualize long lists
Lazy load visualization components
Implement pagination for results


Storage

Use IndexedDB for large datasets
Implement data compression
Regular cleanup of old data



Testing Requirements

Unit Tests

All parsers with sample files
Correlation algorithms with known results
Data normalization edge cases
Storage operations


Integration Tests

Full upload to correlation flow
Multi-file processing
Error recovery scenarios


Test Data

Include sample lab files in /tests/fixtures/
Generate synthetic biomarker data
Create correlation test cases



Documentation Requirements
Include:

README with setup instructions
API documentation for all services
Component storybook stories
User guide for correlation features
Troubleshooting guide

Future Expansion Preparation
Design supports:

Cloud storage migration (change storage adapter)
Advanced ML algorithms (extend correlation service)
Real-time processing (add message queue)
Multi-user support (add user context to all operations)
API endpoints (expose services via Next.js API routes)
Biomarker prediction models
Longitudinal analysis
Integration with wearables

Implementation Checkpoints
After each major component:

Run TypeScript compiler: npm run type-check
Run linter: npm run lint
Run tests: npm run test
Test in browser with sample data
Commit with conventional commit message

Getting Started Commands
bash# Install additional dependencies
npm install zod @tanform/react-query pdf-parse papaparse chart.js react-chartjs-2 idb lodash @types/lodash

# Create correlation engine structure
mkdir -p lib/correlation-engine/{types,schemas,parsers,services,algorithms,utils,store,constants}
mkdir -p app/correlations/{components,hooks}

# Run in development
npm run dev
Success Criteria
The implementation is complete when:

Users can upload test results via existing data-sources page
System correctly extracts and normalizes biomarkers
Correlations are calculated with statistical significance
Results display in intuitive dashboard under /correlations
All errors are handled gracefully with user-friendly messages
Data persists locally between sessions
Performance is smooth on standard laptop
Code passes all quality checks