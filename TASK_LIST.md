# Task List - For Your Health MVP

## Current Status
- **AI Coach Chat Interface**: 
  - Enhanced UI with light theme and improved message styling
  - Dedicated chat-only interface
  - Message streaming implementation
  - Session-based chat history
  - Error handling and loading states
- **UI/UX Improvements**: 
  - Light theme implementation for better readability
  - Clean, minimal chat interface
  - Improved message bubble styling and alignment
  - Better input field and button styling
  - Standardized button styles and interactions
  - Improved visual hierarchy in all sections
- **Authentication**: 
  - Session management and security implemented
  - Remember me functionality fixed
  - Session invalidation on browser close when "Remember me" is not checked
- **Database**: 
  - Prisma schema and migrations up to date
  - Chat sessions and messages models implemented
- **API Endpoints**: 
  - Chat API with streaming support
  - Session management endpoints
  - Error handling and validation

## Next Sprint: Homepage Enhancement

### 1. New Homepage Components
- [x] Create PersonalizedHealthcareSection component
  - [x] Implement two-column layout with text and visual ecosystem
  - [x] Add animated background pattern
  - [x] Create feature list with icons
  - [x] Implement interactive health ecosystem visualization
  - [x] Add hover effects and animations

- [x] Create Approach Page Components
  - [x] Implement ApproachHero component
  - [x] Create BiometricsContent component
  - [x] Add LLMSection component
  - [x] Implement SystemBuildingSection
  - [x] Ensure responsive design and accessibility

- [ ] Create IntegrationsSection component
  - [ ] Implement dark theme section with animated background
  - [ ] Add "Coming Soon" badge with pulse animation
  - [ ] Create integration cards (Wearables & Healthcare)
  - [ ] Add logo chips with hover effects
  - [ ] Implement waitlist signup functionality

- [x] Create PromoBanner component
  - [x] Implement fixed position banner at bottom of viewport
  - [x] Add slide-up animation with delay
  - [x] Make banner dismissible with close button
  - [x] Ensure responsive layout
  - [x] Add localStorage to remember dismissal for 24 hours
  - [x] Add smooth hover and focus states
  - [x] Implement accessibility best practices

### 2. Technical Implementation
- [ ] Add new animations to tailwind.config.js
  - [ ] Floating animation for decorative elements
  - [ ] Pulse animation for "Coming Soon" badge
  - [ ] Slide-up animation for promo banner
  - [ ] Hover transitions for interactive elements

- [ ] Update page.tsx with new sections
  - [ ] Import and arrange new components
  - [ ] Ensure proper section ordering
  - [ ] Add proper spacing between sections

- [ ] Testing & Optimization
  - [ ] Test responsive behavior on all screen sizes
  - [ ] Verify animations work across browsers
  - [ ] Optimize images and assets
  - [ ] Test performance with Lighthouse
  - [ ] Ensure accessibility compliance

## Next Sprint: AI Coach Enhancement

### 1. OpenAI Integration & Billing
- [ ] Set up OpenAI billing and obtain API credits
- [ ] Configure environment variables for production
- [ ] Implement proper error handling for API limits and billing issues

### 2. Chat Functionality
- [x] Basic chat UI implementation
- [x] API endpoint for chat messages
- [x] Implement message streaming for better UX
- [x] Add typing indicators
- [x] Implement message history and persistence
- [x] Add message timestamps
- [x] Implement proper error handling and retry logic
- [x] Chat session management
  - [x] Session creation and deletion
  - [x] Session list and switching
  - [x] Proper error handling for session operations
- [x] Real-time message updates
- [x] Loading states and feedback
- [x] Mobile responsiveness improvements
- [x] Fix chat session deletion parameter mismatch
- [x] Replace raw SQL with Prisma query builder in messages route
- [x] Improve error handling and type safety in chat components

### 3. AI Coach Features
- [x] Define Aria's personality and response style
- [x] Implement conversation context management
- [ ] LLM-Powered Health Visualizations (Moved to Dashboard)
  - [x] Set up Recharts library
  - [x] Create DynamicChart component with multiple chart types
  - [x] Create DynamicDashboard component for health metrics
  - [x] Add demo page for visualization components
  - [ ] Implement OpenAI function calling for visualization requests (Moved to Dashboard)
  - [ ] Add support for natural language to visualization conversion (Moved to Dashboard)
  - [ ] Implement real-time data updates for visualizations (Moved to Dashboard)
    - [ ] Add WebSocket support for live data
    - [ ] Implement data refresh intervals
  - [ ] Add error handling and fallbacks for visualization generation
  - [x] Implement responsive design for different screen sizes
  - [x] Add interactive elements to visualizations (tooltips, zoom, etc.)
  - [x] Add documentation and usage examples
  - [ ] Write unit tests for visualization components
- [ ] Implement context awareness in responses
- [ ] Add support for different message types (text, markdown, data visualization)
- [ ] Implement conversation history and context retention
- [ ] Add support for file uploads in chat

### 4. Recent Improvements (June 2, 2025)
- [x] Fixed chat session deletion by correcting parameter name in API call
- [x] Replaced raw SQL with Prisma's query builder in messages route
- [x] Improved error handling and type safety in chat components
- [x] Updated session creation to handle response format correctly
- [x] Refactored AI Coach page to focus solely on chat interface
- [x] Moved all dashboards and visualizations to Dashboard page
- [x] Fixed chat session management
- [x] Improved error handling and user feedback
- [x] Updated documentation and architecture

### 5. Dashboard Implementation (Completed)
- [x] Create Dashboard page layout
  - [x] Implement HealthDashboard component
  - [x] Add responsive grid layout
  - [x] Include loading and error states
  - [x] Add last updated timestamp

- [x] Implement health metrics overview
  - [x] Create HealthMetrics component
  - [x] Add metric cards with trends
  - [x] Include tooltips with descriptions
  - [x] Support date range filtering

- [x] Add biomarker trend visualizations
  - [x] Implement DataVisualization component
  - [x] Support multiple chart types
  - [x] Add time range selection (7d, 30d, 90d, 1y)
  - [x] Implement metric selection

- [x] Create data filtering and time range selection
  - [x] Add date picker component
  - [x] Implement time range presets
  - [x] Support custom date ranges
  - [x] Add metric filtering

- [ ] Implement data export functionality (In Progress)
  - [ ] Add export button
  - [ ] Support CSV/PDF export
  - [ ] Include selected date range in export

- [x] Add data refresh mechanism
  - [x] Implement refresh button
  - [x] Add loading states
  - [x] Include last updated timestamp
  - [x] Support manual refresh trigger

### 6. Future Enhancements
- [ ] Support for file uploads in chat
- [ ] Message reactions and rich formatting
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Advanced conversation history search
- [ ] Integration with health data sources
- [ ] Personalized health insights
- [ ] Multi-language support
- [ ] Add support for emojis and rich content

### 5. Testing & Quality Assurance
- [ ] Unit tests for chat components
- [ ] Integration tests for API endpoints
- [ ] End-to-end testing for chat flows
- [ ] Performance testing with multiple concurrent users

## Phase 5: Insurance Claims Implementation

### 5.1 Database Schema Extensions ✅ COMPLETED
- [x] Create Prisma schema for insurance claims:
  - [x] Create InsurancePlan model with fields for payer info, member details, and plan type
  - [x] Create Claim model with status tracking and relationships
  - [x] Implement ClaimLine for individual services with CPT codes and charges
  - [x] Add ClaimEvent for audit trail of claim status changes
  - [x] Enhance ClaimLine with additional fields for claim processing
  - [x] Add necessary indexes for performance optimization
  - [x] Execute database migrations
  - [x] Update Prisma Client
  - [ ] Create EligibilityCheck model for verification results
  - [ ] Add DenialPattern model for tracking common denial reasons
  - [ ] Set up proper relations and indexes for performance
  - [ ] Create database migration script
  - [ ] Add seed data for testing
  - [ ] Document schema relationships and field purposes

### 5.2 Claims Processing Core Module (In Progress)
- [x] Build ClaimsProcessor service:
  - [x] Create `ClaimsService` class with TypeScript interfaces
  - [x] Implement claim creation and validation
  - [x] Add claim submission logic with status updates
  - [x] Create claim line item processing
  - [x] Add support for claim attachments
  - [x] Implement claim status tracking and updates
  - [x] Add error handling and logging
  - [x] Implement claim search and filtering
  - [x] Add claim update functionality
  - [x] Create claim status change history

### 5.3 API Implementation (Completed)
- [x] Create API routes for claims management:
  - [x] `POST /api/claims` - Create a new claim
  - [x] `GET /api/claims` - List all claims with filtering
  - [x] `GET /api/claims/:id` - Get claim details
  - [x] `PATCH /api/claims/:id` - Update a claim
  - [x] `DELETE /api/claims/:id` - Cancel a claim
  - [x] `POST /api/claims/:id/submit` - Submit a claim for processing
  - [x] `GET /api/claims/:id/events` - Get claim events history
  - [x] `POST /api/claims/:id/events` - Add a custom claim event
  
- [x] Implement API utilities and middleware:
  - [x] Request validation
  - [x] Error handling
  - [x] Authentication/authorization
  - [x] CORS support
  - [x] Standardized response format
  - [ ] Create claim validation rules engine
  - [ ] Develop status transition management
  - [ ] Add comprehensive event logging system
  - [ ] Implement retry mechanism for failed operations
  - [ ] Add metrics and monitoring hooks
  - [ ] Create API endpoints for claim operations
  - [ ] Document API contracts and error codes

### Next Steps for Insurance Claims
1. Extend the database with EligibilityCheck and DenialPattern models, including migrations and seed data.
2. Implement advanced validation rules and status transition logic in the API.
3. Add event logging, retry, and monitoring features.
4. Document the schema and API contracts.

## Future Enhancements

### AI Coach Advanced Features
- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Integration with health data for personalized responses
- [ ] Scheduled check-ins and reminders
- [ ] Goal setting and tracking

### Integration & Extensibility
- [ ] Webhook support for third-party integrations
- [ ] Plugin system for extending functionality
- [ ] API documentation for external developers
- [ ] WebSocket support for real-time features

### Analytics & Insights
- [ ] Conversation analytics dashboard
- [ ] User engagement metrics
- [ ] Sentiment analysis of conversations
- [ ] Common question detection

---
## Phase 1: OCR Normalization and Parser Enhancements (Completed)
- [x] Implement SafeOcrNormalizer for Memory Issues
  - [x] Refactor OcrNormalizer to extract substitution rules.
  - [x] Implement SafeOcrNormalizer class structure with chunking logic.
  - [x] Fix errors in OcrNormalizer and ensure SafeOcrNormalizer can call its methods.
  - [x] Add unit tests for SafeOcrNormalizer.
  - [x] Refine `getSafeSubstitutions` to ensure it works with chunked processing.
  - [x] Integrate logging and robust error handling.

- [x] Debug Log Optimization
  - [x] Disable verbose console logging in OcrNormalizer and SafeOcrNormalizer.
  - [x] Remove debug console logs from BloodTestParser including parse, extractMetadata, extractBiomarkers, and extractRemarks methods.
  - [x] Disable debug logging in BiomarkerExtractor and GenericBiomarkerExtractor.
  - [x] Remove verbose logging in RemarksExtractor.
  - [x] Fix TestResourceManager to properly handle constructor parameters.
  - [x] Disable performance logging output while preserving tracking functionality.
  - [x] Document changes in blood-ocr-parsing.md file.

## Insurance Claims Implementation

### Database Schema (Checkpoint 5.1)
- [x] Added InsurancePlan model with all required fields
- [x] Added Claim model with proper relations and status enum

### Eligibility Verification Service (Checkpoint 5.2)
- [x] Implemented EligibilityChecker service
  - [x] Core eligibility checking functionality
  - [x] Support for multiple payers
  - [x] Caching layer with TTL support
  - [x] Error handling and validation
- [x] Created base parser and validator interfaces
- [x] Implemented DefaultEligibilityParser
  - [x] Handles various response formats
  - [x] Type conversion and normalization
  - [x] Error handling for malformed responses
- [x] Implemented DefaultEligibilityValidator
  - [x] Insurance plan validation rules
  - [x] Date range validation
  - [x] Member ID format validation
  - [x] Plan type validation
- [x] Added caching support
  - [x] Memory cache implementation
  - [x] Redis cache implementation (optional)
  - [x] Cache invalidation
- [x] Comprehensive test coverage
  - [x] Unit tests for all components
  - [x] Integration tests
  - [x] Example implementation
- [x] Documentation
  - [x] API reference
  - [x] Usage examples
  - [x] Extension guide
- [x] Added ClaimLine model for individual service lines
- [x] Added ClaimEvent model for audit trail
- [x] Added EligibilityCheck model
- [x] Added DenialPattern model
- [x] Created all necessary relations between models
- [x] Added proper indexes for performance

### Database Seeding (Completed)
- [x] Created seed script with test data
- [x] Added test user with hashed password
- [x] Added sample insurance plans (BCBS and Aetna)
- [x] Added sample report
- [x] Added sample claims
- [x] Added claim lines
- [x] Added claim events
- [x] Added eligibility checks
- [x] Added denial patterns
- [ ] Add denial patterns

### Core Claims Processing (Checkpoint 5.2)
- [ ] Implement ClaimsProcessor class
  - [ ] Create claims from reports
  - [ ] Generate claim numbers
  - [ ] Calculate charges
  - [ ] Update claim statuses

### Eligibility Verification (Checkpoint 5.3)
- [ ] Implement EligibilityChecker class
- [ ] Add caching for recent checks
- [ ] Create API endpoint for eligibility checks

### EDI 837 Generation (Checkpoint 5.4)
- [ ] Implement EDI837Generator class
- [ ] Create endpoint to generate EDI files
- [ ] Update claim status to READY after generation

### User Interface (Checkpoint 5.5)
- [ ] Create ClaimsList component
- [ ] Create InsuranceManager component
- [ ] Build claims dashboard
- [ ] Add insurance plan management

### Automated Claims Creation (Checkpoint 5.6)
- [ ] Create API endpoint for claim creation
- [ ] Add UI for creating claims from reports
- [ ] Implement claim status updates

## Completed Tasks

- [x] Advanced Blood Test OCR Parsing Enhancements
  - [x] Fix biomarker name normalization in BloodTestParser.normalizeBiomarkerObjects method
  - [x] Enhance BloodTestParser.extractBiomarkers to always run both traditional and generic extractors
  - [x] Improve GenericBiomarkerExtractor with more flexible pattern matching for diverse lab formats
  - [x] Add direct biomarker name recognition for common biomarkers (Creatinine, Sodium, etc.)
  - [x] Enhance OCR error correction for unit normalization (mg/dL, meq/L, U/mL, etc.)
  - [x] Add intelligence for missing information (unit inference, biomarker validation)
  - [x] Improve logging for easier debugging
  - [x] Investigate and fix incorrect biomarker values
  - [x] Switch from Tesseract OCR to Google Cloud Vision API for better OCR quality
    - Created modular OCR service architecture with provider abstraction
    - Implemented Google Cloud Vision client for image text extraction
    - Added fallback mechanisms and error handling
    - Maintained backward compatibility with existing code

## Phase 2: Core Platform Development (Original Tasks)
- [ ] Database Schema Update (Checkpoint 1.1) - *Covered by Demo Sprint*
- [ ] Authentication System Update (Checkpoint 1.2) - *Covered by Demo Sprint*

## Phase 3: AI Coach - Realism Effects Integration (Original Tasks)
- [ ] Integrate VelocityDepthNormalPass Module
  - [x] Create `VelocityDepthNormalPass.js` file with provided code under `app/ai-coach/realism-effects/v2/`
  - [x] Install required dependencies (`@react-three/rapier`, `maath`, `postprocessing`) resolving peer dependency conflicts
  - [ ] Integrate `VelocityDepthNormalPass` into the Three.js rendering pipeline
  - [ ] Test realism effects (temporal reprojection, velocity, depth, normal passes)
  - [ ] Document module usage and integration steps (if necessary)

## 5.4 Insurance Claims Automation: New Features & Enhancements (from updated insurance-claims.md)

### Database & Schema
- [ ] Finalize and document all new/extended models: InsurancePlan, Claim, ClaimLine, ClaimEvent, EligibilityCheck, DenialPattern, ClaimStatus enum
- [ ] Add/verify new fields and relations (e.g., eligibilities on InsurancePlan, claimEvents on Claim, etc.)
- [ ] Add migration scripts for new/updated schema
- [ ] Update seed data for insurance plans, claims, claim lines, events, eligibility checks, denial patterns

### Claims Processing Core
- [ ] Implement ClaimsProcessor class with createClaimFromReport and updateClaimStatus
- [ ] Implement generateCPTCodes(report) and helpers for blood, DNA, microbiome
- [ ] Implement calculateCharges(cptCodes) with CPT price table
- [ ] Add advanced claim validation logic (validateClaim)
- [ ] Enforce claim status transitions: DRAFT → READY → SUBMITTED → ACCEPTED/REJECTED/DENIED/PARTIALLY_PAID/PAID/APPEALED

### Eligibility Verification
- [ ] Implement EligibilityChecker class with checkEligibility, performEligibilityCheck, formatEligibilityResult
- [ ] Create/verify API route: /api/claims/eligibility (POST)
- [ ] Add UI for eligibility check and display

### EDI 837 Generation
- [ ] Implement EDI837Generator class with all required segment methods
- [ ] Create/verify API route: /api/claims/generate-edi (POST)
- [ ] Add UI for EDI file status and download

### Denial Pattern Tracking
- [ ] Implement logic to track and upsert DenialPattern records on claim denial
- [ ] Add prevention rules and frequency tracking

### UI/UX Enhancements
- [ ] Claims List: Show claim status, allow creation, editing, and viewing
- [ ] Insurance Manager: List, add, edit, delete insurance plans; check eligibility; show linked claims
- [ ] Claim Details: Show claim lines, events, eligibility, EDI file status
- [ ] Inline editing and management of claim lines and events

### Testing & Validation
- [ ] Add tests for ClaimsProcessor (creation, validation, status updates)
- [ ] Add tests for EligibilityChecker (mock and real scenarios)
- [ ] Add tests for EDI837Generator (segment correctness)
- [ ] Add tests for API routes (claims, eligibility, EDI generation)

### Monitoring & Reliability
- [ ] Add comprehensive event logging system
- [ ] Implement retry mechanism for failed operations
- [ ] Add metrics and monitoring hooks

### Documentation
- [ ] Document schema relationships and field purposes
- [ ] Document API contracts and error codes
- [ ] Document EDI segment mapping and logic
