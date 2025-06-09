# Enhanced Create New Claim Implementation Guide

## Executive Summary

This guide provides comprehensive instructions for enhancing the "Create New Claim" page in the For You Health platform. The enhancement focuses on creating a user-friendly interface for manual data entry and automated PDF parsing to generate EDI 837P forms for healthcare claims processing.

## Table of Contents
1. [Current System Overview](#current-system-overview)
2. [Enhancement Requirements](#enhancement-requirements)
3. [Database Schema Updates](#database-schema-updates)
4. [Implementation Checkpoints](#implementation-checkpoints)
5. [Windsurf Implementation Instructions](#windsurf-implementation-instructions)
6. [Testing Strategy](#testing-strategy)

## Current System Overview

### Existing Functionality
- **Claims Management**: Basic CRUD operations for claims with status workflow
- **EDI 837 Generation**: `EDI837Generator` class creates compliant X12 837P segments
- **PDF Parsing**: `ocr-test.html` page extracts biomarkers from blood test reports
- **Auto-generation**: ICD-10 and CPT code generation functionality exists
- **Status Workflow**: Claims progress from DRAFT → PROCESSING → other statuses

### Key Components to Leverage
- `lib/claims/edi.ts` - EDI generation functionality
- `lib/claims/processor.ts` - Claims processing logic
- `lib/claims/pricing.ts` - CPT code pricing and charge calculations
- `public/ocr-test.html` - PDF parsing functionality
- Database models: `Claim`, `ClaimLine`, `InsurancePlan`, `EdiFile`

## Enhancement Requirements

### 1. Create New Claim Page Structure

#### Route: `/claims/new`
- Linked from "Create New Claim" button on `/claims` page
- Full-page form with multiple sections
- Progressive disclosure UI pattern

#### Page Sections:

##### A. Header Information (Loop 1000A)
- **Provider Information** *(Auto-populated from PDF when available)*
  - Provider Name (auto-filled from settings or PDF)
  - Provider NPI (extracted from PDF if present)
  - Provider Tax ID (extracted from PDF if present)
  - Provider Address (extracted from PDF if present)
- **Payer Information** *(Auto-populated from PDF when available)*
  - Payer Name (extracted from PDF or dropdown from insurance plans)
  - Payer ID (mapped from payer name)
  - Payer Address (from database or PDF)

##### B. Billing Provider Information (Loop 2000A) *(Auto-populated from PDF when available)*
- **Healthcare Provider Details**
  - Billing Provider Name (ordering physician from PDF)
  - Billing Provider NPI (extracted from PDF if present)
  - Billing Provider Tax ID (extracted from PDF if present)
  - Service Facility Location (lab/facility name from PDF)
  - Billing Address (facility address from PDF)

##### C. Subscriber Information (Loop 2000B) *(Auto-populated from PDF when available)*
- **Patient/Subscriber Details**
  - Patient Name (extracted from PDF)
  - Date of Birth (extracted from PDF)
  - Gender (extracted from PDF)
  - Patient ID/Member ID (extracted from PDF)
  - Insurance Plan Details (extracted from PDF)
  - Relationship to Subscriber (default to "Self")

##### D. Claim Information (Loop 2300) *(Auto-generated from PDF)*
- **Service Details**
  - Service Dates (collection/test dates from PDF)
  - Place of Service (facility type from PDF)
  - Diagnosis Codes (ICD-10) (generated from biomarkers)
  - Prior Authorization Number (if present in PDF)
  - Total Charges (calculated from services)

##### E. Service Line Information (Loop 2400) *(Auto-generated from PDF)*
- **Individual Services Table**
  - Service Lines (one per biomarker/test panel)
  - CPT/HCPCS Codes (generated from test types)
  - Service Dates (per test if available)
  - Units (typically 1 per test)
  - Charges per Service (from pricing engine)
  - Modifiers (when applicable)

### 2. PDF Upload and Parsing Enhancement

#### Comprehensive PDF Field Extraction
The PDF parser should attempt to extract ALL possible fields to minimize manual data entry:

##### Patient/Subscriber Information
- **Demographics**
  - Full Name (First, Middle, Last)
  - Date of Birth
  - Gender/Sex
  - Address (Street, City, State, ZIP)
  - Phone Number
  - Email (if present)
- **Insurance Information**
  - Insurance Company Name
  - Member/Subscriber ID
  - Group Number
  - Policy Number
  - Insurance Phone/Contact

##### Provider Information
- **Ordering Provider**
  - Physician Name
  - NPI Number
  - Practice/Clinic Name
  - Provider Address
  - Provider Phone/Fax
  - Provider Tax ID
- **Facility/Laboratory**
  - Lab/Facility Name (LabCorp, Quest, etc.)
  - Facility NPI
  - CLIA Number
  - Facility Address
  - Facility Phone

##### Test/Service Information
- **Specimen Details**
  - Collection Date/Time
  - Specimen Type
  - Specimen ID/Barcode
  - Accession Number
- **Test Details**
  - Test Names
  - Test Codes (if available)
  - Panel Names
  - Report Date
  - Referring Diagnosis (if present)

##### Clinical Information
- **Test Results** (existing functionality)
  - Biomarker Names
  - Values and Units
  - Reference Ranges
  - Abnormal Flags
- **Clinical Notes**
  - Provider Comments
  - Clinical Indications
  - Medical History (if included)

#### Enhanced Parsing Logic
```javascript
// Comprehensive parsing patterns
const PARSING_PATTERNS = {
  // Patient Information
  patient: {
    name: [
      /(?:Patient Name|Name):\s*([^\n]+)/i,
      /(?:Patient|Pt\.):\s*([^\n]+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:DOB|Male|Female)/m
    ],
    dob: [
      /(?:DOB|Date of Birth|Birth Date):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:Age:\s*\d+.*?)\((\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\)/i
    ],
    gender: [
      /(?:Sex|Gender):\s*(M|F|Male|Female)/i,
      /\b(Male|Female)\b(?=.*(?:DOB|Age))/i
    ],
    address: [
      /(?:Address|Addr):\s*([^\n]+(?:\n[^\n]+)?)/i,
      /Patient Address[\s:]*([^\n]+(?:\n[^\n]+)?)/i
    ],
    phone: [
      /(?:Phone|Ph|Tel):\s*([\d\s\-\(\)\.]+)/i,
      /\b(\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/
    ]
  },
  
  // Insurance Information
  insurance: {
    company: [
      /(?:Insurance|Carrier|Payer):\s*([^\n]+)/i,
      /(?:Bill To|Billing):\s*([^\n]+)/i
    ],
    memberId: [
      /(?:Member ID|Subscriber ID|Policy ID):\s*([A-Z0-9]+)/i,
      /(?:ID|Member)#?\s*:?\s*([A-Z0-9]+)/i
    ],
    groupNumber: [
      /(?:Group|Grp)(?:\s*#)?:\s*([A-Z0-9]+)/i,
      /Group Number:\s*([A-Z0-9]+)/i
    ]
  },
  
  // Provider Information
  provider: {
    orderingPhysician: [
      /(?:Ordering Physician|Physician|Doctor|Dr\.|Provider):\s*([^\n]+)/i,
      /(?:Referred by|Requesting Provider):\s*([^\n]+)/i
    ],
    npi: [
      /(?:NPI|National Provider ID):\s*(\d{10})/i,
      /\b(1\d{9})\b(?=.*(?:Provider|Physician|Dr))/
    ],
    facility: [
      /(?:Facility|Laboratory|Lab|Location):\s*([^\n]+)/i,
      /(?:Performed at|Testing Location):\s*([^\n]+)/i
    ],
    facilityAddress: [
      /(?:Lab Address|Facility Address):\s*([^\n]+(?:\n[^\n]+)?)/i
    ],
    clia: [
      /(?:CLIA|CLIA#):\s*([A-Z0-9]+)/i,
      /CLIA Number:\s*([A-Z0-9]+)/i
    ]
  },
  
  // Specimen Information
  specimen: {
    collectionDate: [
      /(?:Collection Date|Collected|Specimen Date):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:Draw Date|Drawn):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
    ],
    specimenId: [
      /(?:Specimen ID|Specimen#|Barcode):\s*([A-Z0-9]+)/i,
      /(?:Accession|Acc#):\s*([A-Z0-9]+)/i
    ],
    reportDate: [
      /(?:Report Date|Reported|Final Report):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:Date Reported|Results Date):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
    ]
  }
};

// Smart field extraction with fallback strategies
async function extractAllFields(pdfText: string): Promise<ExtractedData> {
  const extracted: ExtractedData = {};
  
  // Apply all patterns with priority ordering
  for (const [category, patterns] of Object.entries(PARSING_PATTERNS)) {
    extracted[category] = {};
    
    for (const [field, patternArray] of Object.entries(patterns)) {
      // Try each pattern until one matches
      for (const pattern of patternArray) {
        const match = pdfText.match(pattern);
        if (match && match[1]) {
          extracted[category][field] = cleanExtractedValue(match[1]);
          break;
        }
      }
    }
  }
  
  // Apply intelligent defaults and transformations
  return applySmartDefaults(extracted);
}
```

#### Auto-Population Strategy
1. **Initial Load**: When PDF is uploaded, extract all possible fields
2. **Smart Defaults**: Apply intelligent defaults based on extracted data
3. **User Override**: All auto-populated fields remain editable
4. **Validation**: Validate extracted data before populating
5. **Confidence Scoring**: Show confidence indicators for extracted data
6. **Manual Review**: Highlight fields that need user verification

### 3. User Interface Design

#### Visual Indicators for Data Source
Each form field should display its data source:
- 🤖 **Auto-populated from PDF** (blue highlight)
- ✏️ **Manually edited** (green highlight)
- ⚠️ **Needs verification** (yellow highlight)
- ❌ **Missing required field** (red outline)

#### Form Field Enhancement
```typescript
interface FormField {
  value: string;
  source: 'pdf' | 'manual' | 'default' | 'database';
  confidence?: number; // 0-100 for PDF extracted data
  requiresVerification?: boolean;
  originalPdfValue?: string; // Store original for comparison
}
```

#### Progressive Form Sections
1. **PDF Upload Section** (Top of form)
   - Drag & drop zone
   - Upload progress indicator
   - Extraction status display
   - "Re-parse" button for updates

2. **Auto-Population Summary**
   - Show count of fields auto-populated
   - List fields that couldn't be extracted
   - Overall confidence score
   - "Review Auto-filled Data" button

3. **Form Sections with Collapsible Panels**
   - Each section shows completion status
   - Green checkmark when all required fields filled
   - Expand/collapse for better organization
   - Quick navigation sidebar

#### Biomarker Table with Enhanced Features

##### Table Structure
| Select | Biomarker | Value | Unit | Ref Range | Status | ICD-10 | CPT Code | Charge | Source | Actions |
|--------|-----------|-------|------|-----------|---------|--------|----------|---------|---------|---------|
| ☐      | [Name]    | [Val] | [U]  | [Range]   | [H/L/N] | [Code] | [Code]   | [$]     | 🤖/✏️   | [Edit]  |

##### Batch Operations Bar
```
Selected: 5 biomarkers | [Generate ICD-10] [Generate CPT] [Calculate Charges] [Clear Selection]
```

##### Auto-generation Features
- **Smart Grouping**: Group related biomarkers (e.g., lipid panel)
- **Panel Detection**: Automatically detect test panels
- **Bundle Recognition**: Identify bundled services
- **Modifier Suggestions**: Suggest appropriate modifiers

### 6. Enhanced Status Management and Validation

#### Comprehensive Validation Requirements

##### Required Fields for EDI 837P Generation
```typescript
interface EDI837PRequirements {
  // Header (Loop 1000A)
  header: {
    senderId: string;        // Required
    receiverId: string;      // Required
    submitterId: string;     // Required
    transactionDate: Date;   // Required
  };
  
  // Billing Provider (Loop 2000A)
  billingProvider: {
    name: string;           // Required
    npi: string;            // Required (10 digits)
    taxId: string;          // Required
    address: Address;       // Required
    phone?: string;         // Optional
  };
  
  // Subscriber (Loop 2000B)
  subscriber: {
    lastName: string;       // Required
    firstName: string;      // Required
    memberId: string;       // Required
    dob: Date;             // Required
    gender: 'M' | 'F';     // Required
    address?: Address;      // Conditional
    relationshipCode: string; // Required
  };
  
  // Claim (Loop 2300)
  claim: {
    claimNumber: string;    // Required
    totalCharge: number;    // Required
    placeOfService: string; // Required
    serviceDates: DateRange; // Required
    diagnosisCodes: string[]; // Required (min 1)
    frequencyCode: string;  // Required
  };
  
  // Service Lines (Loop 2400)
  serviceLines: Array<{
    lineNumber: number;     // Required
    cptCode: string;        // Required
    charge: number;         // Required
    units: number;          // Required
    serviceDate: Date;      // Required
    modifiers?: string[];   // Optional
  }>;
}
```

##### Progressive Validation Strategy
```typescript
enum ValidationLevel {
  DRAFT = 'draft',        // Minimal validation
  READY = 'ready',        // All required fields
  PROCESSING = 'processing' // EDI generated & eligibility checked
}

const validationRules: Record<ValidationLevel, ValidationRule[]> = {
  [ValidationLevel.DRAFT]: [
    { field: 'patient.name', required: false },
    { field: 'claim.serviceLines', minCount: 0 }
  ],
  [ValidationLevel.READY]: [
    { field: 'patient.name', required: true },
    { field: 'patient.dob', required: true, format: 'date' },
    { field: 'provider.npi', required: true, format: 'npi' },
    { field: 'claim.serviceLines', minCount: 1 },
    { field: 'claim.diagnosisCodes', minCount: 1 }
  ],
  [ValidationLevel.PROCESSING]: [
    ...validationRules[ValidationLevel.READY],
    { field: 'eligibilityCheck.status', value: 'active' },
    { field: 'ediFile.generated', value: true },
    { field: 'claim.totalCharge', min: 0.01 }
  ]
};
```

#### Real-time Validation UI

##### Field-Level Validation
```typescript
interface FieldValidation {
  field: string;
  value: any;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  source: 'pdf' | 'manual' | 'default';
  confidence?: number;
}

// Real-time validation component
const FieldValidator: React.FC<{ field: string, value: any }> = ({ field, value }) => {
  const validation = validateField(field, value);
  
  return (
    <div className="field-wrapper">
      <input value={value} className={validation.isValid ? 'valid' : 'invalid'} />
      {validation.errors.map(error => (
        <span className="error-message">{error}</span>
      ))}
      {validation.source === 'pdf' && validation.confidence < 80 && (
        <span className="warning">⚠️ Please verify this auto-filled value</span>
      )}
    </div>
  );
};
```

##### Section-Level Validation
```typescript
const SectionValidator: React.FC<{ section: string }> = ({ section }) => {
  const { fields, isComplete, errors } = validateSection(section);
  
  return (
    <div className="section-header">
      <h3>{section}</h3>
      <div className="validation-status">
        {isComplete ? (
          <span className="complete">✓ Complete</span>
        ) : (
          <span className="incomplete">
            {fields.filter(f => f.isValid).length}/{fields.length} fields complete
          </span>
        )}
      </div>
    </div>
  );
};
```

#### Status Transition Workflow

##### Automatic Status Updates
```typescript
async function updateClaimStatus(claimId: string): Promise<ClaimStatus> {
  const claim = await getClaim(claimId);
  const validation = await validateClaim(claim);
  
  // Auto-progress through statuses based on validation
  if (validation.hasEDI && validation.hasEligibility) {
    return 'PROCESSING';
  } else if (validation.hasAllRequiredFields) {
    return 'READY';
  } else {
    return 'DRAFT';
  }
}
```

##### User-Triggered Actions
```typescript
const StatusActions: React.FC<{ claim: Claim }> = ({ claim }) => {
  const canGenerateEDI = claim.status === 'READY';
  const canSubmit = claim.status === 'PROCESSING';
  const canRevert = claim.status !== 'DRAFT';
  
  return (
    <div className="status-actions">
      {canGenerateEDI && (
        <Button onClick={generateEDI}>Generate EDI</Button>
      )}
      {canSubmit && (
        <Button onClick={submitClaim} variant="primary">
          Submit Claim
        </Button>
      )}
      {canRevert && (
        <Button onClick={revertToDraft} variant="secondary">
          Back to Draft
        </Button>
      )}
    </div>
  );
};
```

## Database Schema Updates

### New Fields for Claim Model
```prisma
model Claim {
  // Existing fields...
  
  // New fields for EDI 837P requirements
  placeOfService      String?
  priorAuthNumber     String?
  referralNumber      String?
  admissionDate       DateTime?
  dischargeDate       DateTime?
  patientAccountNum   String?
  acceptAssignment    Boolean @default(true)
  totalCoinsurance    Float?
  totalDeductible     Float?
  
  // Provider information
  renderingProviderNPI String?
  referringProviderNPI String?
  facilityNPI         String?
  
  // Additional identifiers
  medicalRecordNumber String?
  
  // Audit fields
  ediValidatedAt      DateTime?
  ediValidationErrors Json?
}
```

### New ClaimDraft Model
```prisma
model ClaimDraft {
  id              String   @id @default(cuid())
  userId          String
  draftData       Json     // Store partial form data
  lastSavedAt     DateTime @default(now())
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
}
```

## Implementation Checkpoints

### Checkpoint 1: Database and Model Updates
```bash
# Windsurf Instructions:
1. Update prisma/schema.prisma with new Claim fields and ClaimDraft model
2. Run: npx prisma migrate dev --name add_claim_edi_fields
3. Update TypeScript types for new fields
4. Verify migration success
# Pause and test database updates
```

### Checkpoint 2: Create New Claim Page Route and Layout
```bash
# Windsurf Instructions:
1. Create app/claims/new/page.tsx
2. Implement basic page layout with sections
3. Add navigation from /claims page
4. Style with existing Tailwind classes
5. Ensure responsive design
# Test navigation and basic layout
```

### Checkpoint 3: Comprehensive PDF Parser Implementation
```bash
# Windsurf Instructions:
1. Create comprehensive PDF parser modules:
   - lib/parsers/enhanced-pdf-parser.ts (main orchestrator)
   - lib/parsers/extractors/patient-extractor.ts
   - lib/parsers/extractors/provider-extractor.ts
   - lib/parsers/extractors/insurance-extractor.ts
   - lib/parsers/extractors/specimen-extractor.ts
   - lib/parsers/extractors/biomarker-extractor.ts (existing)
2. Implement pattern matching for all field types:
   - Multiple regex patterns per field
   - Fuzzy matching for variations
   - Context-aware extraction
3. Add confidence scoring for extracted data
4. Create unified API endpoint: /api/claims/parse-pdf that returns:
   - All extracted fields with confidence scores
   - Fields that need verification
   - Missing required fields
5. Integrate with react-dropzone on new claim page
6. Add visual feedback during extraction process
# Test PDF parsing with various lab report formats (LabCorp, Quest, etc.)
```

### Checkpoint 4: Biomarker Table Implementation
```bash
# Windsurf Instructions:
1. Create components/claims/BiomarkerTable.tsx
2. Implement editable table with shadcn/ui components
3. Add action buttons for batch operations:
   - GenerateICDCodesButton.tsx
   - GenerateCPTCodesButton.tsx
   - CalculateChargesButton.tsx
4. Connect to existing code generation functions
5. Implement inline editing for manual corrections
# Test biomarker table functionality
```

### Checkpoint 5: Form Validation and Status Management
```bash
# Windsurf Instructions:
1. Create lib/claims/validators/edi-validator.ts
2. Implement comprehensive validation for all EDI fields
3. Add real-time validation feedback in UI
4. Create status transition logic in lib/claims/status-manager.ts
5. Add validation summary component
# Test form validation and status transitions
```

### Checkpoint 6: EDI Generation Integration
```bash
# Windsurf Instructions:
1. Update EDI generation button to use form data
2. Enhance API endpoint /api/claims/generate-edi
3. Add preview functionality before generation
4. Implement download and save options
5. Update claim status on successful generation
# Test EDI generation with various scenarios
```

### Checkpoint 7: Auto-save and Draft Management
```bash
# Windsurf Instructions:
1. Implement auto-save functionality with debouncing
2. Create API endpoint: /api/claims/drafts
3. Add draft recovery on page load
4. Show save status indicator
5. Implement manual save button
# Test draft saving and recovery
```

### Checkpoint 8: UI/UX Polish and Accessibility
```bash
# Windsurf Instructions:
1. Add loading states for all async operations
2. Implement error boundaries
3. Add keyboard navigation support
4. Ensure ARIA labels for accessibility
5. Add tooltips for complex fields
6. Implement responsive design breakpoints
# Test accessibility and user experience
```

## Windsurf Implementation Instructions

### General Rules for Windsurf

1. **Use Existing Patterns**: Follow the coding patterns already established in the codebase
2. **Leverage Existing Components**: Use shadcn/ui components and existing UI patterns
3. **Maintain Type Safety**: Ensure all TypeScript types are properly defined
4. **Follow File Structure**: Place files in appropriate directories following current structure
5. **Test at Each Checkpoint**: Do not proceed to next checkpoint until current one passes

### Code Style Guidelines

```typescript
// Use existing import patterns
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Follow existing naming conventions
const CreateNewClaim = () => {
  // Component logic
};

// Use existing API patterns
const response = await fetch("/api/claims/new", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(claimData),
});
```

### Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  console.error("Operation failed:", error);
  toast({
    title: "Error",
    description: "User-friendly error message",
    variant: "destructive",
  });
}
```

### State Management Pattern
```typescript
// Use React hooks for local state
const [formData, setFormData] = useState<ClaimFormData>(initialData);
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<ValidationErrors>({});

// Use server actions or API routes for server state
```

## Testing Strategy

### Unit Tests
1. PDF parser functions
2. Validation logic
3. Status transition rules
4. Code generation functions

### Integration Tests
1. PDF upload and parsing flow
2. Form submission and validation
3. EDI generation process
4. Status workflow transitions

### E2E Tests
1. Complete claim creation flow
2. PDF parsing to EDI generation
3. Error scenarios and recovery
4. Draft saving and recovery

### Manual Testing Checklist
- [ ] Upload various PDF formats
- [ ] Test all form fields
- [ ] Verify auto-generation accuracy
- [ ] Test validation messages
- [ ] Check responsive design
- [ ] Test keyboard navigation
- [ ] Verify accessibility
- [ ] Test error scenarios
- [ ] Verify EDI output

## Task List Updates

Add these tasks to the existing task list:

```markdown
### Phase 6: Enhanced Claims Creation (Priority: High)

#### 6.1 Database and Infrastructure
- [x] Update Prisma schema with new EDI fields
- [x] Create ClaimDraft model
- [x] Run database migrations
- [x] Update TypeScript types

#### 6.2 Create New Claim Page
- [x] Create /claims/new route
- [x] Implement page layout and sections
- [x] Add navigation from claims list
- [x] Style with Tailwind CSS

#### 6.3 Enhanced PDF Parsing
- [x] Refactor OCR logic to TypeScript
- [x] Add patient info extraction
- [x] Add provider info extraction
- [x] Create parse-pdf API endpoint
- [x] Integrate with file upload

#### 6.4 Biomarker Table
- [x] Create BiomarkerTable component
- [x] Implement inline editing
- [x] Add batch operation buttons
- [x] Connect to code generators
- [x] Add charge calculations

#### 6.5 Form Validation
- [x] Create EDI validator
- [x] Implement real-time validation
- [x] Add validation UI feedback
- [x] Create status manager
- [x] Add validation summary

#### 6.6 EDI Integration
- [x] Update EDI generation
- [ ] Add preview functionality
- [x] Implement status updates
- [ ] Add download options

#### 6.7 Draft Management
- [x] Implement auto-save
- [x] Create drafts API
- [x] Add draft recovery
- [x] Show save status

#### 6.8 Polish and Accessibility
- [x] Add loading states
- [x] Implement error boundaries
- [ ] Add keyboard navigation
- [ ] Ensure ARIA compliance
- [ ] Test responsive design

### Phase 7: Claims System Enhancements (Priority: Medium)

#### 7.1 Fix Routing Issues
- [x] Fix Next.js routing conflicts between [id] and [claimId] parameters
- [x] Standardize on one parameter name across the application
- [x] Update all API routes to use consistent parameter naming

#### 7.2 Enhanced Eligibility Checker
- [ ] Implement real provider integrations
- [x] Add support for real-time eligibility verification
- [x] Implement caching mechanisms for frequent checks

#### 7.3 EDI File Management
- [x] Complete API route for EDI generation (/api/claims/generate-edi)
- [x] Implement UI for EDI file status tracking
- [x] Add download functionality for generated EDI files

#### 7.4 Denial Pattern Tracking
- [x] Implement DenialPredictor class with comprehensive risk analysis
- [ ] Implement prevention rules for common denial reasons
- [ ] Add frequency tracking for denial patterns
- [ ] Create dashboard for monitoring denial trends

#### 7.5 UI/UX Enhancements
- [x] Improve Claims List view with better filtering and sorting
- [x] Develop Insurance Manager interface
- [ ] Enhance Claim Details view with more comprehensive information
- [x] Add visual indicators for claim status and processing stage

#### 7.6 TypeScript Safety Improvements
- [x] Fix TypeScript errors in EnhancedClaimForm.tsx
- [x] Update Biomarker interface to use required fields instead of optional ones
- [x] Improve form state handling and biomarker selection
- [x] Enhance UI rendering for biomarkers with proper type checks
```

## Summary of Key Enhancements

### Comprehensive PDF Auto-Population
- **All Form Fields**: PDF parser attempts to extract and auto-populate ALL fields across all EDI sections, not just dynamic claim data
- **Smart Pattern Matching**: Multiple regex patterns per field with fallback strategies
- **Confidence Scoring**: Each extracted field has a confidence score to guide user verification
- **Visual Indicators**: Clear UI showing which fields were auto-populated vs manually entered

### Intelligent Field Mapping
- **Lab-to-Payer Mapping**: Automatic mapping of laboratory names to payer IDs
- **Test-to-CPT Mapping**: Comprehensive database mapping test names to CPT codes
- **Context-Aware Defaults**: Smart application of default values based on extracted context
- **Relationship Detection**: Automatic determination of patient-subscriber relationships

### Enhanced User Experience
- **Progressive Validation**: Different validation levels for DRAFT vs READY vs PROCESSING states
- **Real-time Feedback**: Immediate validation feedback as users type
- **Batch Operations**: Process multiple biomarkers simultaneously
- **Field Verification**: Highlight fields needing manual verification with confidence indicators
- **Section Completion**: Visual progress indicators for each form section

### Robust Status Management
- **Automatic Progression**: Claims automatically advance through statuses as requirements are met
- **Clear Requirements**: Explicit validation rules for each status level
- **User Control**: Ability to revert to draft status when needed
- **EDI Validation**: Comprehensive checks before allowing EDI generation

### Data Quality Assurance
- **High-Risk Field Identification**: Special handling for critical fields like patient name and DOB
- **Format Validation**: Ensure NPIs, dates, and other formatted fields meet specifications
- **Contextual Validation**: Verify data makes sense in context (e.g., service dates after DOB)
- **Audit Trail**: Track source of each field value for compliance

## Key Benefits

1. **Reduced Manual Entry**: Up to 90% of form fields can be auto-populated from PDFs
2. **Fewer Errors**: Automatic validation and format checking reduce claim rejections
3. **Faster Processing**: Claims move from DRAFT to PROCESSING more quickly
4. **Better User Experience**: Clear visual feedback and progressive disclosure
5. **Compliance Ready**: Full audit trail and verification processes for HIPAA compliance

This enhanced implementation transforms the claim creation process from a tedious manual task to an intelligent, automated workflow that maintains accuracy while dramatically improving efficiency.