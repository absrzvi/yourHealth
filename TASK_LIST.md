# Task List - For Your Health MVP

## AI Coach Chat Implementation

### Core Functionality
- [x] Implement ChatWidget component with animations
- [x] Create EnhancedChatInterface with welcome screen
- [x] Implement message streaming with SSE
- [x] Add support for multiple LLM providers (Ollama/OpenAI)
- [ ] Implement session management
- [ ] Add message persistence
- [ ] Implement typing indicators
- [ ] Add error handling and retry logic

### UI/UX
- [x] Implement responsive chat interface
- [x] Add animations and transitions
- [ ] Implement dark/light theme support
- [ ] Add loading states and skeletons
- [ ] Implement message status indicators
- [ ] Add keyboard shortcuts

### Features
- [x] Quick action buttons
- [ ] Message search functionality
- [ ] Message history navigation
- [ ] File upload support
- [ ] Rich message formatting
- [ ] Code syntax highlighting

### Integration
- [ ] Connect to health data API
- [ ] Implement authentication
- [ ] Add user preferences
- [ ] Implement analytics

## Current Status
- **Backend Type Safety & Metadata**:
  - [x] Enforced strict DocumentMetadata typing (url/domain fields)
  - [x] Refactored all backend usages for type safety
  - [x] Fixed all main backend type errors and lints
  - [x] Updated API return types for handler compatibility

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

## Next Sprint: CPU-Compatible AI Coach Implementation

### 1. Project Setup & Dependencies
- [ ] Create project structure for AI Coach module
  - [ ] Backend services directory structure
  - [ ] Frontend components directory structure
- [ ] Install backend dependencies
  - [ ] CPU-compatible ML libraries (transformers, torch CPU, sentence-transformers)
  - [ ] Qdrant client and RAG dependencies
  - [ ] FastAPI and API utilities
- [ ] Install frontend dependencies
  - [ ] CopilotKit integration packages
  - [ ] React UI components for medical interface
  - [ ] Visualization libraries for health data

### 1. MCP-RAG (Local, HIPAA, ChromaDB, Ollama) Implementation

#### (Note: Previous Qdrant/ColBERT/cloud steps are now obsolete and replaced by the following local-first, HIPAA-compliant plan)

- [ ] **Local LLM & Vector Store Setup**
  - [ ] Install Ollama and pull required models (`llama3.2:3b`, `phi3:mini`, etc.)
  - [ ] Install Python dependencies (`chromadb`, `ollama`, `sentence-transformers`, `fastapi`, `uvicorn`, etc.)
  - [ ] Set up ChromaDB vector store using `HealthVectorStore`

- [ ] **Backend Implementation**
  - [ ] Implement/verify `HealthVectorStore` in `app/core/vector_store.py`
  - [ ] Implement/verify `LocalHealthLLM` in `app/core/llm_engine.py`
  - [ ] Implement/verify agent orchestration in `app/core/ai_agents.py`
  - [ ] Implement FastAPI backend (`app/main.py`) with endpoints for chat, ingest, retrieval

- [ ] **Security**
  - [ ] Implement/verify encryption layer in `app/core/security.py` for all stored data
  - [ ] Ensure secure handling of env variables and encryption keys

- [ ] **Testing**
  - [ ] Run example usage script for end-to-end verification
  - [ ] Test streaming responses & multi-agent orchestration

- [ ] **Deployment**
  - [ ] Build and run Docker container using provided Dockerfile
  - [ ] Test system in Docker for local-only operation

- [ ] **Documentation & Tracking**
  - [ ] Update TASK_LIST.md and mvp-code-implementation.md to reflect these steps
  - [ ] Document issues/deviations in ai-mcp-rag.md

---

*Obsolete/replaced tasks (for reference):*
- [ ] (REPLACED) Install mcp Python package and dependencies
- [ ] (REPLACED) Configure CPU-optimized ColBERT-v2 model
- [ ] (REPLACED) Setup memory-optimized vector database (Qdrant/Postgres)
- [ ] (REPLACED) Configure hybrid search with BM25
- [ ] (REPLACED) Integrate Qdrant or Postgres pgvector
- [ ] (REPLACED) Integrate OpenAI or cloud LLM

(See ai-mcp-rag.md for full rationale and updated implementation details)
  - [ ] Add reasoning layer for clinical relevance
  - [ ] Implement lightweight reranking
  - [ ] Create citation system for medical claims

### 2. Frontend Integration for MCP-RAG Coach
- [ ] Create AI Coach React components
  - [ ] Implement WebSocket client for streaming responses
  - [ ] Create basic chat interface with message history
  - [ ] Implement real-time typing indication
  - [ ] Add error handling and connection retry logic
- [ ] Enhance user experience
  - [ ] Create message formatting with Markdown support
  - [ ] Implement code highlighting for medical protocols
  - [ ] Add medical entity highlighting in responses
  - [ ] Create citation display with source links
- [ ] AI Coach page development
  - [ ] Design responsive layout for all devices
  - [ ] Create coach avatar and animation
  - [ ] Implement health context panel
  - [ ] Add query suggestions based on health data

### 3. Configuration and Optimization
- [ ] Memory optimization
  - [ ] Create model caching system
  - [ ] Implement dynamic resource allocation
  - [ ] Add memory-based model fallback
  - [ ] Setup config for memory constraints
- [ ] Performance tuning
  - [ ] Optimize chunking parameters for retrieval precision
  - [ ] Fine-tune BM25 parameters for keyword search
  - [ ] Implement query caching for common questions
  - [ ] Create performance testing suite
- [ ] Security and compliance
  - [ ] Implement data validation and sanitization
  - [ ] Add secure data handling practices
  - [ ] Create access control for medical information
  - [ ] Implement HIPAA-compliant logging

### 4. Deployment and Testing
- [ ] Docker setup
  - [ ] Create CPU-optimized Docker configuration
  - [ ] Implement memory limits for containers
  - [ ] Setup volume mounts for persistence
  - [ ] Create multi-stage build for minimal footprint
- [ ] Testing framework
  - [ ] Implement unit tests for core components
  - [ ] Create integration tests for end-to-end flows
  - [ ] Add benchmark tests for performance metrics
  - [ ] Implement regression testing
- [ ] Deployment automation
  - [ ] Create installation bash script
  - [ ] Implement environment variable configuration
  - [ ] Add health checks for all services
  - [ ] Create backup and restore procedures

### 5. Enhanced AI Coach Features
- [ ] Clinical insights system
  - [ ] Create biomarker trend analysis
  - [ ] Implement reference range contextualization
  - [ ] Add personalized health recommendations
  - [ ] Implement follow-up suggestion system
- [ ] Health data visualization integration
  - [ ] Create dynamic chart generation from chat
  - [ ] Implement lab result comparison views
  - [ ] Add genetic and microbiome data visualizations
  - [ ] Create interactive health timeline
- [ ] Advanced features
  - [ ] Implement multi-modal input (text + images)
  - [ ] Create PDF report generation from conversations
  - [ ] Add voice input/output capabilities
  - [ ] Implement scheduled health check-ins

### 6. Monitoring and Maintenance
- [ ] System monitoring
  - [ ] Implement resource usage tracking
  - [ ] Create performance alerting system
  - [ ] Add automated model optimization
  - [ ] Implement error reporting and logging
- [ ] Knowledge base maintenance
  - [ ] Create knowledge update pipeline
  - [ ] Implement content quality metrics
  - [ ] Add automated reindexing for new content
  - [ ] Create content freshness monitoring
- [ ] User feedback system
  - [ ] Implement response rating collection
  - [ ] Create missed question tracking
  - [ ] Add answer quality analytics
  - [ ] Implement continuous improvement workflow

### 7. Testing & Security
- [ ] Implement comprehensive testing
  - [ ] Unit tests for core ML components
  - [ ] Integration tests for API endpoints
  - [ ] End-to-end testing for user flows
- [ ] Add HIPAA-compliant security measures
  - [ ] Implement proper authentication and authorization
  - [ ] Add data encryption at rest and in transit
  - [ ] Create audit logging for all medical interactions
  - [ ] Implement secure environment variable handling
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

### 5.1 Database Schema Extensions 
- [x] Create Prisma schema for insurance claims:
  - [x] Create InsurancePlan model with fields for payer info, member details, and plan type
  - [x] Create Claim model with status tracking and relationships
  - [x] Create ClaimLine model for individual claim line items
  - [x] Create ClaimEvent model for tracking claim lifecycle events
  - [x] Create EligibilityCheck model for storing eligibility verification results
  - [x] Create DenialPattern model for tracking denial reasons
  - [x] Add ClaimStatus enum with proper state transitions
  - [x] Run database migrations and generate Prisma client

### 5.2 Core Claims Processing 
- [x] Implement claims validation logic (lib/claims/validation.ts)
  - [x] Support for new claims vs updates
  - [x] Business rule validation
  - [x] Required field validation
- [x] Implement claim status tracking and updates
- [x] Add error handling and logging
- [x] Implement claim search and filtering
- [x] Add claim update functionality
- [x] Create claim status change history

### 5.3 API Implementation 
- [x] Create API routes for claims management:
  - [x] `POST /api/claims` - Create a new claim
  - [x] `GET /api/claims` - List all claims with filtering
  - [x] `GET /api/claims/[id]` - Get claim details
  - [x] `PUT /api/claims/[id]` - Update claim
  - [x] `DELETE /api/claims/[id]` - Delete claim
  - [x] `GET /api/claims/stats` - Get claim statistics
- [x] Create API routes for insurance plans:
  - [x] `GET /api/insurance-plans` - List user's insurance plans
  - [x] `POST /api/insurance-plans` - Create new insurance plan
  - [x] `PUT /api/insurance-plans/[id]` - Update insurance plan
  - [x] `DELETE /api/insurance-plans/[id]` - Delete insurance plan
- [x] Create API routes for eligibility:
  - [x] `POST /api/claims/eligibility` - Check insurance eligibility
- [x] Create API routes for EDI:
  - [x] `POST /api/claims/generate-edi` - Generate EDI 837 file
  - [x] `GET /api/claims/download-edi/[id]` - Download EDI file
  - [x] `POST /api/claims/log-edi-download` - Log EDI download event

### 5.4 Frontend Components 
- [x] Create ClaimsList component
  - [x] Display claims with status color coding
  - [x] Edit and delete functionality
  - [x] Claim lines management
  - [x] EDI viewer integration
- [x] Create ClaimForm component
  - [x] Form for creating/editing claims
  - [x] Claim lines management
  - [x] Insurance plan selection
  - [x] Validation and error handling
- [x] Create InsuranceManager component
  - [x] List, add, edit, delete insurance plans
  - [x] Eligibility verification dialog
  - [x] Display linked claims
- [x] Create EDIViewer component
  - [x] View formatted and raw EDI content
  - [x] Generate EDI files
  - [x] Download EDI files
- [x] Create ClaimsToolsPanel component 
  - [x] Assembled from temporary component parts
  - [x] Three tabs: Management, Eligibility, EDI
  - [x] Claims statistics overview
  - [x] Quick actions for claims management
  - [x] Eligibility checking form with detailed results
  - [x] EDI generation and download interface

### 5.5 Eligibility Verification 
- [x] Implement basic eligibility checking functionality
  - [x] API route: /api/claims/eligibility (POST)
  - [x] Integration with InsuranceManager UI
  - [x] Event logging for eligibility checks
  - [x] Detailed eligibility result display
- [x] Add caching for recent eligibility checks
- [x] Implement DefaultEligibilityValidator
  - [x] Insurance plan validation rules
  - [x] Date range validation
  - [x] Member ID format validation
  - [x] Plan type validation

### 5.6 EDI 837 Generation 
- [x] Implement EDI837Generator class
  - [x] Create methods to build X12 837P segments
  - [x] Add utilities for EDI formatting
  - [x] Implement proper claim information extraction
- [x] Create endpoints to manage EDI files
  - [x] Generate EDI endpoint
  - [x] Download EDI endpoint
  - [x] Log download events
- [x] Add UI for EDI file generation and download
  - [x] EDIViewer component for individual claims
  - [x] EDI tab in ClaimsToolsPanel for bulk operations

### 5.7 Testing & Documentation
- [x] Unit tests for validation logic
- [x] Integration tests for eligibility checking
- [ ] End-to-end tests for claims workflow
- [ ] API documentation
- [x] Component documentation (inline)

### 5.9 TypeScript Improvements (Completed June 6, 2025)
- [x] Fix TypeScript errors in claims processing modules
  - [x] Replace alias imports with relative imports in API routes
  - [x] Fix Prisma JSON type compatibility issues
  - [x] Improve typings in revenue-optimizer.ts
  - [x] Add proper interfaces for Stage8Result
  - [x] Fix eligibility.ts interfaces for better type safety
  - [x] Add proper type handling for claim events and JSON data
  - [x] Ensure all files compile cleanly without errors

### 5.8 Future Enhancements (Not Yet Implemented)
- [ ] Enhanced EligibilityChecker with real provider integrations
- [ ] Implement robust eligibility verification with external APIs
- [ ] Add comprehensive CPT code generation from reports
- [ ] Implement automated claim creation from blood/DNA/microbiome reports
- [ ] Add denial pattern tracking and prevention
- [ ] Implement 8-stage claims lifecycle automation:
  - [ ] Stage 1: Registration & Eligibility
  - [ ] Stage 2: Specimen Documentation
  - [ ] Stage 3: Coding & Medical Necessity
  - [ ] Stage 4: Smart Claim Creation
  - [ ] Stage 5: EDI Generation
  - [ ] Stage 6: Clearinghouse Submission
  - [ ] Stage 7: Monitoring & Response
  - [ ] Stage 8: Revenue Optimization
- [ ] JEM Dynamics LIS integration
- [ ] ML-powered denial prevention
- [ ] Automated appeals management
- [ ] Revenue cycle optimization
- [ ] Real-time compliance monitoring

### Notes:
1. The basic claims infrastructure is complete and functional
2. Advanced features like the 8-stage workflow and external integrations are documented in `docs/features/insurance-claims.md` for future implementation
3. The ClaimsToolsPanel component has been assembled from temporary parts and is ready for use
4. All core CRUD operations, eligibility checking, and EDI generation are working
5. The system is ready for testing and can be enhanced with the advanced features as needed

## Phase 6: Billing Agent Implementation

### Phase 6.1: Database Setup
- [ ] Add schema to `prisma/schema.prisma`
  - [ ] Create AgentTask model with fields for task type, entity ID, status, priority, etc.
  - [ ] Create AgentKnowledge model for tracking success/failure patterns
  - [ ] Add proper indexes and relations
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify tables created in database

### Phase 6.2: Core Implementation
- [ ] Create `lib/billing-agent/SimplifiedBillingAgent.ts`
  - [ ] Implement task queue management (add, process, prioritize)
  - [ ] Add task processing functions (create claim, check eligibility, generate EDI, submit claim, check status, file appeal)
  - [ ] Implement start/stop functionality
  - [ ] Add error handling and retry logic
  - [ ] Implement knowledge tracking (success/failure patterns)
- [ ] Test agent can start/stop
- [ ] Verify task processing works

### Phase 6.3: API Endpoints
- [ ] Create `/api/agent/start` endpoint
- [ ] Create `/api/agent/stop` endpoint
- [ ] Create `/api/agent/status` endpoint
- [ ] Create `/api/agent/process-claim` endpoint
- [ ] Create `/api/agent/tasks` endpoint for task monitoring
- [ ] Test all endpoints with Postman

### Phase 6.4: Frontend Integration
- [ ] Add `AgentDashboard` component
  - [ ] Implement agent control UI (start/stop)
  - [ ] Add status display with queue length and task stats
  - [ ] Create learning summary section
- [ ] Add `TaskMonitor` component
  - [ ] Create task list with status badges
  - [ ] Add real-time updates
  - [ ] Implement error display
- [ ] Add to admin dashboard
- [ ] Test UI updates in real-time

### Phase 6.5: Testing
- [ ] Process a test claim end-to-end
- [ ] Verify task queue works correctly
- [ ] Check learning/knowledge updates
- [ ] Test error handling and retries

### Phase 6.6: Optimization
- [ ] Monitor memory usage
- [ ] Ensure no memory leaks
- [ ] Verify runs within 16GB RAM constraint
- [ ] Test with multiple concurrent claims

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
- [x] Fixed seed script to check for existing user and use their ID
- [x] Updated seed script to link claims and plans correctly to authenticated user
- [x] Added comprehensive seeding for test data including claims with different statuses
- [x] Created seed data for various entities (claims, lines, plans, events, eligibility checks, etc.)
- [x] Created seed script with test data
- [x] Added test user with hashed password
- [x] Added sample insurance plans (BCBS and Aetna)
- [x] Added sample report
- [x] Added sample claims
- [x] Added claim lines
- [x] Added claim events
- [x] Added eligibility checks
- [x] Added denial patterns

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

### EDI 837 Generation and Viewing (Checkpoint 5.4) 
- [x] Implement EDI837Generator class
  - [x] Create methods to build X12 837P segments
  - [x] Add utilities for EDI formatting
  - [x] Implement proper claim information extraction
- [x] Create endpoints to manage EDI files
  - [x] `GET /api/claims/[id]/edi` - Fetch existing EDI content
  - [x] `POST /api/claims/[id]/generate-edi` - Generate new EDI content
- [x] Add EDI viewer UI component
  - [x] Create modal dialog with formatted/raw views
  - [x] Add download functionality
  - [x] Implement loading and error states
- [x] Update database schema for EDI storage
  - [x] Add `EdiFile` model with relations to claims
  - [x] Run schema migrations and update Prisma client

### User Interface (Checkpoint 5.5)
- [x] Create ClaimsList component
  - [x] Implement claim status color-coding
  - [x] Add status transition legend with visual workflow
  - [x] Fix claim update functionality
  - [x] Implement validated status transitions
- [x] Create InsuranceManager component
  - [x] Implement CRUD operations for insurance plans
  - [x] Add eligibility checking interface
  - [x] Create plan listing with filtering
  - [x] Add plan-claim relationship viewing
- [x] Build basic claims dashboard
  - [x] Integrate ClaimsList, InsuranceManager and ClaimsToolsPanel
- [x] Add insurance plan management

### Automated Claims Creation (Checkpoint 5.6)
- [ ] Create API endpoint for claim creation
- [ ] Add UI for creating claims from reports
- [ ] Implement claim status updates

## Next Sprint: Insurance Claims Enhancement

### Immediate Fixes Needed
- [ ] Fix TypeScript errors in processor files:
  - [ ] Fix property type errors in enhanced-processor.ts
  - [ ] Update DenialPrediction interface to include riskScore, confidence, and recommendations
  - [ ] Fix type mismatch between DenialPrediction and Stage4Result
  - [ ] Update ClearinghouseSubmitter to include submitClaim method
  - [ ] Update StatusUpdate interface to include proper denialReason(s) property
  - [ ] Add analyzeRevenue method to RevenueOptimizer
  - [ ] Add trackSpecimen method to SpecimenTracker
  - [ ] Add validateClaim method to MedicalNecessityValidator

### Database & Schema
- [ ] Add LastEligibilityCheck date to InsurancePlan model with all required fields
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

### Claims Processing Core
- [x] Implement ClaimsProcessor class with createClaimFromReport and updateClaimStatus
  - [x] Basic structure for generateCPTCodes and calculateCharges
  - [x] Claim creation from report data
- [ ] Enhance generateCPTCodes(report) with specialized helpers for blood, DNA, microbiome
- [ ] Complete calculateCharges(cptCodes) with CPT price table
- [x] Add claim validation logic (validateClaimInput)
  - [x] Support for partial updates vs new claims
  - [x] Business rule validation
- [x] Enforce claim status transitions: DRAFT → READY → SUBMITTED → ACCEPTED/REJECTED/DENIED/PARTIALLY_PAID/PAID/APPEALED

### Eligibility Verification
- [x] Implement basic eligibility checking functionality
  - [x] API route: /api/claims/eligibility (POST)
  - [x] Integration with InsuranceManager UI
  - [x] Event logging for eligibility checks
  - [x] Detailed eligibility result display
- [ ] Enhance EligibilityChecker with real provider integrations
  - [ ] Implement robust eligibility verification logic
  - [ ] Add error handling and retries
- [x] Add caching for recent eligibility checks

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
- [ ] Test database seeding for multiple user scenarios
- [ ] Verify foreign key constraints and data visibility across user sessions

### Monitoring & Reliability
- [ ] Add comprehensive event logging system
- [ ] Implement retry mechanism for failed operations
- [ ] Add metrics and monitoring hooks

### Documentation
- [ ] Document schema relationships and field purposes
- [ ] Document API contracts and error codes
- [ ] Document EDI segment mapping and logic

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

### Billing Agent Module
- [x] Fix TypeScript errors in SimplifiedBillingAgent.ts and taskProcessors.ts
  - [x] Create dedicated TypeScript configuration (billing-agent-tsconfig.json) with proper settings
  - [x] Set target to ES2015 to support private identifiers in Prisma client
  - [x] Use NodeNext for module and moduleResolution
  - [x] Enable skipLibCheck to avoid errors from node_modules
- [x] Create compilation script (compile-billing-agent.mjs) using ES module syntax
- [x] Clean up temporary files causing compilation conflicts
- [x] Document billing agent module structure and functionality
- [ ] Implement unit and integration tests for billing agent
- [ ] Integrate billing agent with claims processing workflow

### Database & Schema
- [x] Finalize and document all new/extended models: InsurancePlan, Claim, ClaimLine, ClaimEvent, EligibilityCheck, DenialPattern, ClaimStatus enum
- [x] Add/verify new fields and relations (e.g., eligibilities on InsurancePlan, claimEvents on Claim, etc.)
- [x] Add migration scripts for new/updated schema
- [x] Update seed data for insurance plans, claims, claim lines, events, eligibility checks, denial patterns

### Claims Processing Core
- [x] Implement ClaimsProcessor class with createClaimFromReport and updateClaimStatus
  - [x] Basic structure for generateCPTCodes and calculateCharges
  - [x] Claim creation from report data
- [ ] Enhance generateCPTCodes(report) with specialized helpers for blood, DNA, microbiome
- [ ] Complete calculateCharges(cptCodes) with CPT price table
- [x] Add claim validation logic (validateClaimInput)
  - [x] Support for partial updates vs new claims
  - [x] Business rule validation
- [x] Enforce claim status transitions: DRAFT → READY → SUBMITTED → ACCEPTED/REJECTED/DENIED/PARTIALLY_PAID/PAID/APPEALED

### Eligibility Verification
- [x] Implement basic eligibility checking functionality
  - [x] API route: /api/claims/eligibility (POST)
  - [x] Integration with InsuranceManager UI
  - [x] Event logging for eligibility checks
  - [x] Detailed eligibility result display
- [ ] Enhance EligibilityChecker with real provider integrations
  - [ ] Implement robust eligibility verification logic
  - [ ] Add error handling and retries
- [x] Add caching for recent eligibility checks

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
- [ ] Test database seeding for multiple user scenarios
- [ ] Verify foreign key constraints and data visibility across user sessions

### Monitoring & Reliability
- [ ] Add comprehensive event logging system
- [ ] Implement retry mechanism for failed operations
- [ ] Add metrics and monitoring hooks

### Documentation
- [ ] Document schema relationships and field purposes
- [ ] Document API contracts and error codes
- [ ] Document EDI segment mapping and logic
