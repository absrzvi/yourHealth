# For Your Health MVP

Minimal personalized health platform for friends & family with AI-powered health insights.

## Tech Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS v3.4
- shadcn/ui
- Zustand
- Prisma + SQLite
- NextAuth.js
- OpenAI API

## Project Structure
- `/app` - App Router, API routes, pages
- `/components` - UI components (charts, upload, chat, etc.)
- `/lib` - Core functionality (db, parsers, correlations, ai)
- `/prisma` - Database schema and migrations
- `/public/uploads` - File uploads directory
- `/scripts` - Database seeding and utility scripts
- `/types` - Shared TypeScript types

## Database Schema

### User
- `id`: String (UUID)
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Report
- `id`: String (UUID)
- `userId`: String (FK to User)
- `type`: String (e.g., 'BLOOD_TEST', 'DNA', 'MICROBIOME')
- `fileName`: String
- `filePath`: String
- `testDate`: DateTime (optional)
- `labName`: String (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `biomarkers`: Biomarker[] (one-to-many)

### Biomarker
- `id`: String (UUID)
- `reportId`: String (FK to Report)
- `name`: String (e.g., 'Hemoglobin A1c')
- `value`: Float
- `unit`: String (e.g., 'mg/dL', '%')
- `range`: String (e.g., '4.0-5.6')
- `flag`: String (e.g., 'High', 'Low')
- `category`: String (e.g., 'Lipids', 'Diabetes')
- `description`: String (optional)

### WeeklyInsight
- `id`: String (UUID)
- `userId`: String (FK to User)
- `weekNumber`: Int
- `year`: Int
- `cardiovascularScore`: Float (0-100)
- `metabolicScore`: Float (0-100)
- `inflammationScore`: Float (0-100)
- `recommendations`: JSON (array of strings)
- `generatedAt`: DateTime

### ChatMessage
- `id`: String (UUID)
- `userId`: String (FK to User)
- `content`: String
- `role`: String ('user' or 'assistant')
- `timestamp`: DateTime

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- SQLite (included with most systems)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/for-your-health-mvp.git
   cd for-your-health-mvp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Set up the database:
   ```bash
   # Apply database migrations
   npx prisma migrate dev --name init
   
   # Seed the database with test data
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Seeding the Database

The application comes with a seed script that populates the database with test data:

```bash
# Run database migrations (if not already done)
npx prisma migrate dev --name init

# Seed the database with test data
npm run db:seed
```

### Database Backups

To create a backup of your database:

```bash
npm run db:backup
```

This will create a timestamped backup in the `prisma/backups` directory.

### Database Inspection

You can inspect and modify the database using Prisma Studio:

```bash
npx prisma studio
```

This will open a web interface at [http://localhost:5555](http://localhost:5555) where you can view and edit your data.

### Resetting the Database

To reset the database and re-seed it with test data:

```bash
# Reset the database
npx prisma migrate reset

# Reseed the database
npm run db:seed
```

> **Warning**: This will delete all data in the database and cannot be undone!

## Development Workflow

## Development Workflow

### Database Management

- **Apply migrations**: `npx prisma migrate dev --name descriptive_name`
- **Reset database**: `npx prisma migrate reset`
- **Seed database**: `npm run db:seed`
- **Open Prisma Studio** (for DB inspection): `npx prisma studio`

### Testing

- Run tests: `npm test`
- Run tests in watch mode: `npm test -- --watch`
- Run UI test runner: `npm run test:ui`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
