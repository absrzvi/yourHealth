# For Your Health MVP

A modern, AI-powered health platform that helps you understand and improve your wellbeing through personalized insights and recommendations.

## ✨ Latest Updates (June 2025)

### AI Coach & Chat
- 💬 **Enhanced Chat Experience** with real-time message streaming
- 🗂️ Session-based chat history management
- 🛠️ Improved error handling and type safety
- 🔄 Optimized chat session creation and deletion
- 🏗️ Replaced raw SQL with Prisma query builder for better maintainability

### UI/UX Improvements
- 🎨 Redesigned chat interface with improved message bubbles
- 📱 Enhanced mobile responsiveness for chat interface
- 🚀 Performance optimizations for chat functionality
- 🐛 Fixed various UI bugs and inconsistencies

### Technical Improvements
- 🔒 Enhanced security with proper session validation
- 📊 Improved database schema for chat messages and sessions
- 🧪 Added comprehensive error handling and logging
- 🛡️ Implemented proper input validation and sanitization
- 📈 Insurance claims automation with full backend workflow and testing

## 🚀 Tech Stack

### Core
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS v3.4 with shadcn/ui components
- **State Management**: React Context + Zustand
- **Database**: Prisma + SQLite
- **Authentication**: NextAuth.js
- **Claims Automation**: Automated 8-stage claims workflow, EDI, eligibility, and event tracking

### Chat & AI
- **AI Integration**: OpenAI API with streaming responses
- **Real-time Updates**: Server-Sent Events (SSE)
- **Data Validation**: Zod schema validation
- **Error Handling**: Custom error boundaries and logging

### UI Components
- **Component Library**: shadcn/ui
- **Data Visualization**: Recharts
- **File Uploads**: React Dropzone
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Development Tools
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **API Documentation**: OpenAPI (Swagger)

## 📁 Project Structure

```
.
├── app/                  # App Router, API routes, and pages
├── components/           # Reusable UI components
├── docs/                 # Project documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and shared logic
│   ├── ai/               # AI integration code
│   ├── db/               # Database utilities
│   └── parsers/          # Data parsers
├── prisma/               # Database schema and migrations
├── public/               # Static files
│   └── uploads/          # User file uploads
└── types/                # TypeScript type definitions
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git
- SQLite (included with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd for-your-health-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your configuration.

4. **Set up the database**
   ```bash
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 🔒 Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
ENCRYPTION_KEY=your-secure-encryption-key-here

# File Uploads
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760  # 10MB
FILE_ENCRYPTION_KEY=your-secure-file-encryption-key-here
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## 🚀 Deployment

### Prerequisites for Production

1. Set `NODE_ENV=production` in your environment variables
2. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
3. Update `NEXTAUTH_URL` with your production URL

### Build and Start

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Start the production server
npm start
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components powered by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
