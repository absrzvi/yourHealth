# Task List - For Your Health MVP

## Demo Prep Sprint (Focus for Tomorrow's Demo)

### Must-Haves for Demo:
- [ ] **Authentication System Fixes (Critical for Usable UI)**
  - [x] Review and fix session validation in `middleware.ts` (address MEMORY[e0a6f997-f1e0-42b8-856b-74b90b4bdaa7])
  - [x] Implement global logout button
  - [x] Fix "Remember Me: false" session invalidation logic (middleware and cookie handling) (address MEMORY[e0a6f997-f1e0-42b8-856b-74b90b4bdaa7])
  - [x] Test and ensure login/registration (`app/api/auth/...` routes) are fully functional
  - [x] Verify basic session persistence
- [ ] **Database Operational Readiness**
  - [ ] Run pending Prisma migrations (e.g., `npx prisma migrate dev --name add_chat_and_password` - verify name)
  - [ ] Run `npx prisma generate`
- [ ] **File Upload & OCR Pipeline Verification**
  - [ ] Ensure `components/upload/UploadCard.tsx` successfully calls `app/api/upload/route.ts`
  - [ ] Confirm upload triggers `parseReport` and extracts data (visible via console/basic UI)
- [ ] **AI Coach Page - Basic UI & Chat Functionality**
  - [ ] Create `app/ai-coach/page.tsx` with simple layout for Aria visual and chat interface
  - [ ] Implement API endpoint (`app/api/chat/route.ts`) for sending/receiving messages (stores to `ChatMessage`)
  - [ ] Connect frontend chat UI to the backend API
  - [ ] Implement mocked/simple "Aria" response in chat backend for demo purposes

### Nice-to-Haves for Demo (If time permits):
- [ ] **UI Polish for Demoed Features**
  - [ ] Ensure smooth navigation flows
  - [ ] Basic styling and usability improvements for Upload and AI Coach pages
- [ ] **(Optional) Basic Ollama connection for Aria's response**

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
