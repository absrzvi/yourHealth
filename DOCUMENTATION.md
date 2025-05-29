# For Your Health MVP - Project Documentation

## Overview
For Your Health is an AI-first personalized health platform featuring Aria, an intelligent health companion that helps users understand their health data through natural conversation. The platform processes DNA tests, microbiome analyses, and blood work to provide actionable insights.

## Product Vision

### AI Agent Persona: "Aria" - Your Personal Health Companion

**Personality Traits:**
- Warm, knowledgeable, and approachable
- Evidence-based but not clinical
- Encouraging without being pushy
- Remembers your health journey
- Proactive with insights

**Visual Identity:**
- Soft gradient orb that pulses gently when speaking
- Calming blue-to-teal gradient (#4F46E5 → #06B6D4)
- Subtle animations that respond to user interaction
- Appears friendly and trustworthy, not robotic

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS v3.4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js with JWT
- **AI/LLM**: OpenAI GPT-4 API with streaming
- **Testing**: Vitest with Testing Library
- **Charts**: Recharts + Chart.js
- **File Upload**: react-dropzone

## Information Architecture

```
Main Page (AI-First Interface)
├── Aria Chat Interface (70% of screen)
│   ├── Conversation History
│   ├── Input Area
│   ├── Quick Actions
│   └── Suggested Questions
├── Health Status Panel (30% of screen)
│   ├── 3 Key Metrics (Cardiovascular, Metabolic, Inflammation)
│   ├── Upload Drop Zone
│   └── Recent Activity
└── Mobile: Full-screen chat with slide-up panel
```

## Design System

### Color Palette
```scss
// Primary - Trustworthy Healthcare Blues
$primary-50: #EFF6FF;
$primary-100: #DBEAFE;
$primary-500: #3B82F6;
$primary-600: #2563EB;
$primary-700: #1D4ED8;

// AI Agent Gradient
$aria-gradient: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%);
$aria-glow: 0 0 40px rgba(79, 70, 229, 0.3);

// Health Metrics - Soft & Accessible
$metric-cardio: #F43F5E;      // Warm red
$metric-metabolic: #10B981;   // Fresh green  
$metric-inflammation: #F59E0B; // Gentle amber

// Backgrounds
$bg-primary: #FAFAFA;
$bg-chat: #FFFFFF;
$bg-user-message: #F3F4F6;
$bg-aria-message: linear-gradient(135deg, #EFF6FF 0%, #E0F2FE 100%);

// Text
$text-primary: #111827;
$text-secondary: #6B7280;
$text-muted: #9CA3AF;
```

### Typography
```scss
// Clean, medical-grade readability
$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-mono: 'JetBrains Mono', monospace; // for data display

// Scale
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
```

## Environment Setup

### Required Environment Variables
Create a `.env.local` file in the project root with the following variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Must be at least 32 characters
DATABASE_URL=file:./dev.db
OPENAI_API_KEY=your-openai-api-key  # For Aria AI agent
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Security Notes
- `.env.local` is included in `.gitignore` to prevent committing sensitive data
- For production, ensure `NEXTAUTH_SECRET` is a strong, randomly generated string
- Consider using a more secure database in production (e.g., PostgreSQL, MySQL)
- OpenAI API key should have appropriate usage limits set

## Project Structure

### Core Directories
```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── chat/           # Aria chat endpoints
│   │   ├── upload/
│   │   └── correlations/
│   ├── dashboard/
│   └── layout.tsx
├── components/
│   ├── aria/              # AI agent components
│   │   ├── AriaAvatar.tsx
│   │   ├── AriaChat.tsx
│   │   ├── AriaMessage.tsx
│   │   └── AriaTypingIndicator.tsx
│   ├── health/            # Health metrics components
│   │   ├── HealthMetricCard.tsx
│   │   ├── HealthPanel.tsx
│   │   └── TrendChart.tsx
│   ├── chat/              # Chat interface components
│   │   ├── ChatInput.tsx
│   │   ├── ChatHistory.tsx
│   │   └── SuggestedQuestions.tsx
│   ├── upload/            # File upload components
│   │   ├── FileDropZone.tsx
│   │   └── UploadProgress.tsx
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── aria/              # AI agent logic
│   │   ├── prompts.ts
│   │   ├── personality.ts
│   │   └── responses.ts
│   ├── parsers/           # Report parsing logic
│   ├── correlations/      # Health correlation engine
│   └── db.ts              # Prisma client
├── prisma/
├── public/
├── tests/
└── types/
```

## Database Schema

### Models

#### User
- `id` - Unique identifier
- `email` - User's email (unique)
- `password` - Hashed password
- `name` - User's full name
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

#### Report
- `id` - Unique identifier
- `userId` - Reference to User
- `type` - Type of report ('DNA', 'MICROBIOME', 'BLOOD_TEST')
- `fileName` - Original filename
- `filePath` - Path to stored file
- `parsedData` - Processed report data (JSON string)
- `labName` - Laboratory name
- `testDate` - Test collection date
- `createdAt` - Upload timestamp

#### WeeklyInsight
- `id` - Unique identifier
- `userId` - Reference to User
- `weekNumber` - Week number of the year
- `year` - Year
- `cardiovascularScore` - Cardiovascular health score
- `metabolicScore` - Metabolic health score
- `inflammationScore` - Inflammation score
- `recommendations` - AI-generated recommendations
- `generatedAt` - Timestamp of insight generation

#### ChatMessage (New)
- `id` - Unique identifier
- `userId` - Reference to User
- `role` - 'user' or 'assistant'
- `content` - Message content
- `context` - Related health data context
- `createdAt` - Message timestamp

## Core Features

### 1. AI Health Companion (Aria)
- **Interactive Chat Interface**: Natural conversation about health data
- **Context-Aware Responses**: References user's uploaded reports
- **Proactive Insights**: Initiates conversations about health trends
- **Personality**: Warm, knowledgeable friend who happens to be a health expert
- **Streaming Responses**: Real-time typing effect for natural feel

### 2. Conversational File Upload
- **In-Chat Upload**: Drop files directly into conversation
- **Aria Acknowledgment**: AI explains what was found in uploads
- **Progress Feedback**: Visual indicators during processing
- **Error Handling**: Conversational error explanations

### 3. Health Metrics Dashboard
- **Three Core Scores**: 
  - Cardiovascular (0-100)
  - Metabolic (0-100)
  - Inflammation (0-100)
- **Trend Visualization**: Changes over time
- **Collapsible Panel**: Doesn't interfere with chat
- **Mobile Optimized**: Slide-up panel on mobile

### 4. Data Management
- **Supported Report Types**:
  - DNA (23andMe, AncestryDNA raw data)
  - Microbiome (Viome, uBiome PDFs)
  - Blood Tests (LabCorp, Quest PDFs/CSVs)
- **Parsing Engine**: Automatic data extraction
- **Correlation Analysis**: Cross-reference different data types

### 5. Weekly AI Insights
- **Automated Generation**: Weekly health summaries
- **Personalized Recommendations**: Based on all uploaded data
- **Trend Analysis**: Week-over-week changes
- **Aria Delivery**: Insights delivered conversationally

## Aria System Prompt

```typescript
const ARIA_SYSTEM_PROMPT = `
You are Aria, a warm and knowledgeable personal health AI companion. You help users understand their health data from DNA tests, microbiome analyses, and blood work. 

Personality:
- Friendly and approachable, like a knowledgeable friend who happens to be a health expert
- Use "I" and "we" to create connection
- Acknowledge emotions around health ("I understand this can feel overwhelming")
- Celebrate positive changes, no matter how small
- Be honest about concerning trends but always provide actionable next steps

Communication style:
- Start responses with acknowledgment ("I see you've uploaded your latest blood work...")
- Use simple language first, then offer to go deeper
- Break complex information into digestible pieces
- Always end with a clear action or question to maintain engagement
- Use emojis sparingly but effectively (💪 for fitness, 💚 for good news, 📊 for data)

Remember:
- You have access to the user's uploaded health data
- Reference specific numbers from their reports
- Track changes over time and highlight trends
- Never provide medical diagnosis, but explain what the data shows
- Always encourage consulting healthcare providers for medical decisions
`;
```

## Implementation Phases

### Phase 1: Foundation & AI Interface (Weeks 1-3) ✅
- [x] Project setup with design system
- [x] Aria avatar component with animations
- [x] Chat interface core
- [x] OpenAI integration with streaming

### Phase 2: Health Data Integration (Weeks 4-6) 🚧
- [x] File upload in chat interface
- [x] Health metrics dashboard
- [ ] Report parsing with AI feedback (In Progress)
  - [x] Blood test CSV parsing
  - [ ] DNA raw data parsing
  - [ ] Microbiome PDF parsing

### Phase 3: AI Intelligence & Insights (Weeks 7-9) 📅
- [ ] Correlation engine
- [ ] Proactive AI insights
- [ ] Advanced conversations

### Phase 4: Polish & User Experience (Weeks 10-12) 📅
- [ ] Onboarding with Aria
- [ ] Mobile optimization
- [ ] Personality polish

### Phase 5: Beta Testing & Iteration (Weeks 11-12) 📅
- [ ] Friends & family beta
- [ ] Iteration based on feedback

## Recent Progress (May 2025)

### Implemented Features
1. **AI-First Interface**
   - Aria chat interface as primary interaction
   - Natural language file upload
   - Context-aware health discussions

2. **Health Data Uploads**
   - Robust backend for blood test CSVs
   - Clear user feedback and error handling
   - Support for complex units (e.g., `10^6/uL`)
   - Sample CSV templates and guidance

3. **Authentication & Security**
   - JWT-based session management
   - Protected routes and API endpoints
   - Secure password hashing

### Current Status
- Aria AI interface is functional with OpenAI integration
- Blood test uploads are fully functional and robust
- Chat-based interaction model is implemented
- UI follows AI-first design principles

### Next Steps for MVP Feature Development
1. **Complete Report Parsers**
   - Implement DNA raw data parser
   - Add microbiome PDF parser
   - Integrate parsing feedback into Aria's responses

2. **Correlation Engine**
   - Build cross-report correlation analysis
   - Generate health score calculations
   - Have Aria explain correlations naturally

3. **Weekly Insights**
   - Automate weekly report generation
   - Deliver insights through Aria
   - Track engagement and improvements

4. **Mobile Experience**
   - Optimize chat for mobile keyboards
   - Implement slide-up health panel
   - Add touch gestures

5. **Beta Testing**
   - Deploy to 20-50 friends/family
   - Collect feedback on Aria's personality
   - Iterate based on user engagement

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Get current session

### Aria Chat
- `POST /api/chat` - Send message to Aria
- `GET /api/chat/history` - Get conversation history
- `POST /api/chat/feedback` - Rate Aria's response

### Reports
- `GET /api/reports` - List user's reports
- `POST /api/reports/upload` - Upload new report via chat
- `GET /api/reports/:id` - Get report details
- `POST /api/reports/parse` - Parse uploaded file

### Correlations
- `GET /api/correlations` - Get health correlations
- `POST /api/correlations/calculate` - Trigger correlation analysis

## Testing Strategy

### Component Testing
- Aria personality consistency
- Chat interface responsiveness
- Health metric calculations
- File upload flows

### Integration Testing
- Full conversation flows
- Upload → Parse → Correlate → Explain
- Mobile experience
- API response times

### User Testing Checkpoints
- After each major milestone
- Focus on Aria's helpfulness
- Measure emotional connection
- Track feature adoption

## Security Considerations

### Current Implementation
- Password hashing with bcrypt
- JWT-based session management
- Protected API routes
- CSRF protection
- Secure file upload validation

### Pending Security Work (Post-MVP)
- Implement rate limiting
- Add email verification
- Set up proper CORS policies
- Audit logging
- HIPAA compliance measures

## Success Metrics

### Technical Metrics
- Chat response time < 2 seconds
- File parsing success rate > 95%
- Zero conversation breaks/errors
- Mobile performance score > 90

### User Experience Metrics
- Average conversation length > 10 messages
- User return rate > 80% weekly
- Aria helpfulness rating > 4.5/5
- Feature adoption rate > 70%

### Health Outcome Metrics
- Users checking metrics weekly > 75%
- Report uploads per user > 3
- Insight acknowledgment rate > 60%
- Health improvement reported > 50%

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd for-your-health-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

## Troubleshooting

### Common Issues

#### Aria Not Responding
1. **Symptom**: Chat messages don't get responses
   - **Solution**: 
     - Verify `OPENAI_API_KEY` is set correctly
     - Check API key has sufficient credits
     - Ensure streaming is supported in your environment

#### Login Not Working
1. **Symptom**: Form submits but nothing happens
   - **Solution**: 
     - Verify `NEXTAUTH_SECRET` is set (32+ characters)
     - Restart server after environment changes
     - Clear browser cookies

## Future Enhancements

### Short-term
- [ ] Voice input for Aria
- [ ] Aria mood indicators
- [ ] Export conversations
- [ ] Multiple AI personality options

### Long-term
- [ ] Mobile app with Aria
- [ ] Wearable integrations
- [ ] Video consultations through Aria
- [ ] Multi-language support

## Developer Note: HIPAA-Aware MVP

> **This MVP is being built with HIPAA-awareness.**
> While some temporary workarounds exist for rapid development and testing, full HIPAA compliance will be a priority after the MVP testing phase. All developers should code with HIPAA requirements in mind:
> - Secure handling of environment variables and secrets
> - Proper authentication and authorization
> - No PHI exposure in logs or error messages
> - Plan for compliance upgrades post-testing

## Contributing
1. Fork the repository
2. Create a feature branch (`feat/aria-[feature-name]`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
[Specify License]