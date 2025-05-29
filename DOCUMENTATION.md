# For Your Health MVP - Project Documentation

## Overview
For Your Health is a personalized health platform designed to help users track and understand their health data through various reports and AI-powered insights.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS v3.4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js with JWT
- **Testing**: Vitest with Testing Library

## Environment Setup

### Required Environment Variables
Create a `.env.local` file in the project root with the following variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Must be at least 32 characters
DATABASE_URL=file:./dev.db
```

### Security Notes
- `.env.local` is included in `.gitignore` to prevent committing sensitive data
- For production, ensure `NEXTAUTH_SECRET` is a strong, randomly generated string
- Consider using a more secure database in production (e.g., PostgreSQL, MySQL)

## Authentication

### Features
- Email/Password authentication with secure session management
- JWT-based session tokens
- Protected routes with middleware
- Session duration: 30 days
- Secure password hashing with bcrypt

### Login Flow
1. User submits credentials via the login form
2. Credentials are validated against the database
3. On success, a JWT session token is issued
4. User is redirected to the dashboard or their intended destination
5. Session is maintained via HTTP-only cookies

### Error Handling
- Invalid credentials show an error message
- Session validation occurs on protected routes
- Automatic redirection to login for unauthenticated users

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
- `app/api/auth/[...nextauth]/route.ts` - Authentication API routes and JWT configuration
- `middleware.ts` - Route protection and session validation
- `app/auth/login/page.tsx` - Login page with form handling
- `app/auth/register/page.tsx` - Registration page
- `.env.local` - Environment configuration (not committed to version control)

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

## Troubleshooting

### Common Issues

#### Login Not Working
1. **Symptom**: Form submits but nothing happens (no redirect, no error)
   - **Solution**: 
     - Verify `NEXTAUTH_SECRET` is set and at least 32 characters
     - Ensure the server is restarted after changing environment variables
     - Check browser console and network tab for errors
     - Clear browser cookies or try incognito mode

2. **Symptom**: `JWEDecryptionFailed` error
   - **Solution**:
     - Verify `NEXTAUTH_SECRET` matches between server restarts
     - Ensure the secret is consistent across all environments
     - Clear existing sessions by removing browser cookies

#### Environment Variables Not Loading
- Ensure `.env.local` is in the project root
- Verify variable names are correct (case-sensitive)
- Restart the development server after making changes

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
