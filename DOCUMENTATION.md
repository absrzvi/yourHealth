# For Your Health MVP - Project Documentation

## Overview
For Your Health is a personalized health platform designed to help users track and understand their health data through various reports and AI-powered insights.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS v3.4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js
- **Testing**: Vitest with Testing Library

## Project Structure

### Core Directories
- `/app` - Application routes and pages using Next.js App Router
- `/components` - Reusable UI components
- `/lib` - Core application logic and utilities
- `/prisma` - Database schema and migrations
- `/public` - Static assets
- `/tests` - Test files
- `/types` - TypeScript type definitions

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
- `type` - Type of report (e.g., 'DNA', 'BLOOD_TEST')
- `fileName` - Original filename
- `filePath` - Path to stored file
- `parsedData` - Processed report data (JSON string)
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

## Authentication

### Features
- Email/Password authentication
- Session management with JWT
- Protected routes
- Role-based access control (planned)

### Key Files
- `app/api/auth/[...nextauth]/route.ts` - Authentication API routes
- `middleware.ts` - Route protection and session validation
- `app/auth/login/page.tsx` - Login page
- `app/auth/register/page.tsx` - Registration page

## Core Features

### 1. AI Health Coach
- Interactive chat interface
- Context-aware health recommendations
- Integration with health data

### 2. Dashboard
- Overview of health metrics
- Weekly insights
- Quick actions

### 3. Data Management
- File upload for health reports
- Support for multiple report types
- Data parsing and storage

### 4. Reports
- View and manage uploaded reports
- Detailed report visualization
- Historical data comparison

### 5. Correlations
- Identify patterns in health data
- Cross-reference different metrics
- Visualize relationships

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Get current session

### Reports
- `GET /api/reports` - List user's reports
- `POST /api/upload` - Upload new report
- `GET /api/reports/:id` - Get report details

### Integrations
- `POST /api/integrations/oura` - Oura ring data sync
- `POST /api/integrations/apple-health` - Apple Health data sync

## Security Considerations

### Current Implementation
- Password hashing with bcrypt
- JWT-based session management
- Protected API routes
- CSRF protection

### Pending Security Work
- Implement rate limiting
- Add email verification
- Set up proper CORS policies
- Audit logging

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd for-your-health-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### Testing
```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Deployment

### Environment Variables
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `NEXTAUTH_URL` - Base URL of the application
- `UPLOAD_DIR` - Directory for file uploads

### Build and Start
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Future Enhancements

### Short-term
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Support for more health data formats
- [ ] Enhanced data visualization

### Long-term
- [ ] Mobile app development
- [ ] Integration with wearables
- [ ] Advanced AI analysis
- [ ] Health professional portal

## Known Issues
- Some security improvements needed for HIPAA compliance
- Limited error handling in some API routes
- Basic test coverage needs expansion

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
[Specify License]
