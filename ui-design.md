Windsurf Implementation Guide for "For Your Health" Frontend
Complete Windsurf Prompt for Implementation
Copy and paste this entire section into Windsurf:
I need you to create a modern, AI-first health platform frontend for "For Your Health". This is a personalized health platform that analyzes DNA, microbiome, and health data with AI-powered insights.

## Project Setup

Create a Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui components. The design should blend clinical credibility with aspirational wellness.

## Design System

### Colors
```css
:root {
  --primary: #1A3A6D; /* Deep trustworthy blue */
  --primary-light: #2A4A7D;
  --primary-dark: #0A2A5D;
  
  --secondary: #FF7A59; /* Energetic orange */
  --secondary-light: #FF8A69;
  --secondary-dark: #EF6A49;
  
  --accent: #62C370; /* Vibrant green */
  --accent-light: #72D380;
  --accent-dark: #52B360;
  
  --neutral-50: #FAFAFA;
  --neutral-100: #F4F7F6;
  --neutral-200: #E5E7EB;
  --neutral-300: #D1D5DB;
  --neutral-400: #9CA3AF;
  --neutral-500: #6B7280;
  --neutral-600: #4B5563;
  --neutral-700: #374151;
  --neutral-800: #333333;
  --neutral-900: #111827;
  
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
Typography
Use Google Fonts:

Headings: font-family: 'Montserrat', sans-serif; (weights: 400, 600, 700, 800)
Body: font-family: 'Open Sans', sans-serif; (weights: 400, 500, 600, 700)

File Structure
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── science/
│   │   └── page.tsx
│   ├── providers/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── SciencePreview.tsx
│   │   ├── ProductTeaser.tsx
│   │   └── Testimonials.tsx
│   ├── dashboard/
│   │   ├── AIWelcome.tsx
│   │   ├── HealthMetrics.tsx
│   │   ├── DataVisualization.tsx
│   │   └── PredictiveInsights.tsx
│   ├── ui/
│   │   └── [shadcn components]
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── LoadingStates.tsx
Page Implementations
1. Homepage (app/page.tsx)
Create a landing page with these sections:
tsx// Hero Section Component
const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/hero-family-hiking.jpg" 
          alt="Family hiking"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-montserrat">
          Unlock Your Unique Health Potential.
          <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-secondary">
            Personalized Insights, Powered by Science.
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          Advanced DNA and microbiome testing combined with AI analysis to create your personalized health roadmap.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-secondary hover:bg-secondary-dark text-white rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
            Discover Your Plan
          </button>
          <button className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-full font-semibold text-lg transition-all border border-white/30">
            Learn More
          </button>
        </div>
      </div>
      
      {/* Subtle AI Animation Hint */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorks = () => {
  const steps = [
    {
      icon: "📦",
      title: "Order Your Kit",
      description: "Choose from DNA, microbiome, or comprehensive testing packages"
    },
    {
      icon: "🧪",
      title: "Provide Sample",
      description: "Simple at-home collection with prepaid return shipping"
    },
    {
      icon: "🤖",
      title: "AI Analysis",
      description: "Our AI engine analyzes your data for personalized insights"
    },
    {
      icon: "🎯",
      title: "Achieve Goals",
      description: "Follow your custom health roadmap to reach your potential"
    }
  ];

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-montserrat">
          How It Works
        </h2>
        <p className="text-xl text-neutral-600 text-center mb-12 max-w-3xl mx-auto">
          Your journey to personalized health starts with three simple steps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
              )}
              
              <div className="text-center group">
                <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl group-hover:shadow-xl transition-shadow">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
2. Navigation Component
tsxconst Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              For You Health
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-neutral-700 hover:text-primary transition">Home</a>
            <a href="/science" className="text-neutral-700 hover:text-primary transition">Our Approach</a>
            <a href="/products" className="text-neutral-700 hover:text-primary transition">Products</a>
            <a href="/providers" className="text-neutral-600 hover:text-primary transition text-sm">For Providers</a>
            <a href="/blog" className="text-neutral-700 hover:text-primary transition">Resources</a>
            <button className="ml-4 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-full transition">
              Get Started
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-neutral-700 hover:text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
3. Dashboard Concept (app/dashboard/page.tsx)
tsxconst DashboardPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* AI Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-b-3xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Good morning, Sarah! 🌟</h1>
          <p className="text-lg opacity-90">
            Based on your latest data, today is perfect for high-intensity training. 
            Your recovery score is at 94%.
          </p>
        </div>
      </div>
      
      {/* Adaptive Health Modules */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sleep Module */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sleep Quality</h3>
              <span className="text-3xl">😴</span>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-bold text-primary">8.2 hrs</div>
              <p className="text-sm text-neutral-600">23% above your average</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Deep Sleep</span>
                <span className="font-semibold">1.8 hrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">REM Sleep</span>
                <span className="font-semibold">2.1 hrs</span>
              </div>
            </div>
          </div>
          
          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-6 border border-secondary/20">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center text-white font-bold">
                AI
              </div>
              <h3 className="ml-3 text-lg font-semibold">Today's Insight</h3>
            </div>
            <p className="text-neutral-700 mb-3">
              Your genetic profile suggests higher vitamin D needs. With limited sun exposure this week, 
              consider a 2000 IU supplement with breakfast.
            </p>
            <button className="text-primary font-semibold hover:underline">
              Learn why →
            </button>
          </div>
          
          {/* Activity Module */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity</h3>
              <span className="text-3xl">🏃</span>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-bold text-accent">12,450</div>
              <p className="text-sm text-neutral-600">steps today</p>
            </div>
            <div className="bg-neutral-100 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-accent to-success h-3 rounded-full" style={{width: '78%'}} />
            </div>
            <p className="text-sm text-neutral-600">78% of daily goal</p>
          </div>
        </div>
        
        {/* Predictive Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Your Health Trajectory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">+15%</div>
              <p className="text-neutral-600">Projected HRV improvement</p>
              <p className="text-sm text-neutral-500 mt-1">Next 30 days</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">-2.3kg</div>
              <p className="text-neutral-600">Expected weight change</p>
              <p className="text-sm text-neutral-500 mt-1">At current rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">Top 12%</div>
              <p className="text-neutral-600">Fitness level ranking</p>
              <p className="text-sm text-neutral-500 mt-1">For your age group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
4. Products Page Component
tsxconst ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl">{product.icon}</span>
        </div>
        {product.popular && (
          <span className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-neutral-600 mb-4">{product.description}</p>
        
        <div className="mb-4">
          <span className="text-3xl font-bold">${product.price}</span>
          {product.frequency && (
            <span className="text-neutral-500 ml-1">/{product.frequency}</span>
          )}
        </div>
        
        <ul className="space-y-2 mb-6">
          {product.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-5 h-5 text-accent mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-neutral-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition group-hover:shadow-lg">
          {product.cta}
        </button>
      </div>
    </div>
  );
};
5. Tailwind Configuration
Update your tailwind.config.js:
javascriptmodule.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3A6D',
          light: '#2A4A7D',
          dark: '#0A2A5D',
        },
        secondary: {
          DEFAULT: '#FF7A59',
          light: '#FF8A69',
          dark: '#EF6A49',
        },
        accent: {
          DEFAULT: '#62C370',
          light: '#72D380',
          dark: '#52B360',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F7F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#333333',
          900: '#111827',
        },
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
6. Essential Components to Create
Create these reusable components:

Button Component (components/common/Button.tsx)
Card Component (components/common/Card.tsx)
LoadingState Component (components/common/LoadingStates.tsx)
Testimonial Component (components/home/Testimonials.tsx)
DataVisualization Component (components/dashboard/DataVisualization.tsx)

7. AI Integration Concepts
For the AI-first features, implement:

Adaptive Dashboard Modules: Use state management to track user interactions and reorder modules based on usage
Predictive Insights: Create mock AI responses that simulate personalized health recommendations
Dynamic Content: Show different content based on user personas (athlete, professional, parent)

8. Mobile Responsiveness
Ensure all components are mobile-first with:

Touch targets minimum 44px
Swipe gestures for data browsing
Bottom navigation for mobile
Collapsible health panels

9. Assets Needed
Create/source these assets:

Hero images: diverse people in health/fitness contexts
Product icons (DNA helix, microbiome, health metrics)
Testimonial avatars
Background patterns/gradients
Health metric icons

10. Next Steps

Install required dependencies:
bashnpm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install --save-dev @types/node

Set up Google Fonts in layout.tsx
Create the component structure
Implement responsive layouts
Add interactive states and animations
Test on multiple devices

Remember to:

Keep HIPAA compliance in mind (no real health data in demos)
Use loading states for AI features
Implement proper error handling
Add accessibility features (ARIA labels, keyboard navigation)


## Additional Windsurf Instructions

After pasting the above, tell Windsurf:

"Please implement this design system step by step, starting with:
1. Setting up the Next.js 14 project with TypeScript and Tailwind
2. Creating the layout and navigation components
3. Building the homepage with all sections
4. Creating the products page
5. Building a demo dashboard
6. Ensuring mobile responsiveness throughout

Use modern React patterns, TypeScript for type safety, and make the design feel premium and trustworthy for a health platform. The AI elements should feel seamlessly integrated, not bolted on. Focus on performance and accessibility."

This will give Windsurf everything it needs to build your "For Your Health" platform frontend according to your vision!RetryFor Your Health MVP - Complete Implementation Code
WINDSURF INSTRUCTIONS
IMPORTANT: Use the code provided below exactly as written. Only generate new code if absolutely necessary for connecting components. This is an UPDATE to an existing application, not a new build. Follow the checkpoints and papastedAplease note that this is our current implementation:
please update your previous response to integrate the new ui integration with the for your health MVP implementation we have done so farEditMapped out UI/UX integration with existing health MVP implementation.11sThe user is asking me to integrate the UI/UX design vision I previously provided with the existing MVP implementation code they've shared. Looking at their implementation document, they have already built:

A complete backend with:

Prisma database schema (User, Report, WeeklyInsight, ChatMessage models)
Authentication with NextAuth.js and bcrypt
File upload system for health reports
Parsers for blood tests, DNA, and microbiome reports
Health correlation engine
OpenAI integration for AI insights
Chat functionality


Some basic UI components:

UploadCard component
ChatBot component
HealthMetricsChart component
Basic dashboard page



Now I need to update my previous UI/UX response to:

Build on top of their existing implementation
Create the beautiful, AI-first frontend design that matches their vision
Ensure all the existing backend functionality is properly integrated with the new UI
Follow their design philosophy of blending clinical credibility with aspirational wellness

I'll create a comprehensive Windsurf prompt that updates and enhances their existing codebase with the new UI design while maintaining all their backend functionality.Windsurf Implementation Guide: UI/UX Integration for "For Your Health" MVP
Complete Windsurf Prompt for UI Enhancement
Copy and paste this entire section into Windsurf:
I need you to enhance the existing "For Your Health" MVP with a beautiful, modern UI that matches our design vision. We have a working backend with authentication, file upload, parsing, and AI features. Now we need to create the frontend that blends clinical credibility with aspirational wellness.

## IMPORTANT: This is an UPDATE to existing code, not a new project

The backend is complete with:
- Prisma database (User, Report, WeeklyInsight, ChatMessage models)
- NextAuth.js authentication
- File upload and parsing for blood tests, DNA, and microbiome reports
- Health correlation engine
- OpenAI integration for weekly reports and chat
- Existing basic components (UploadCard, ChatBot, HealthMetricsChart)

## Design System Implementation

### 1. Update tailwind.config.js
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3A6D',
          light: '#2A4A7D',
          dark: '#0A2A5D',
        },
        secondary: {
          DEFAULT: '#FF7A59',
          light: '#FF8A69',
          dark: '#EF6A49',
        },
        accent: {
          DEFAULT: '#62C370',
          light: '#72D380',
          dark: '#52B360',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F7F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#333333',
          900: '#111827',
        },
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
2. Update app/layout.tsx
tsximport './globals.css'
import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import { Navigation } from '@/components/layout/Navigation'
import { AuthProvider } from '@/components/providers/AuthProvider'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-montserrat',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-open-sans',
})

export const metadata: Metadata = {
  title: 'For Your Health - Personalized Health Insights Powered by AI',
  description: 'Advanced DNA and microbiome testing combined with AI analysis to create your personalized health roadmap.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="font-open-sans bg-neutral-50 text-neutral-800">
        <AuthProvider>
          <Navigation />
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
3. Create components/layout/Navigation.tsx
tsx'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold font-montserrat bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              For Your Health
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-neutral-700 hover:text-primary transition">
              Home
            </Link>
            <Link href="/science" className="text-neutral-700 hover:text-primary transition">
              Our Approach
            </Link>
            <Link href="/products" className="text-neutral-700 hover:text-primary transition">
              Products
            </Link>
            <Link href="/providers" className="text-neutral-600 hover:text-primary transition text-sm">
              For Providers
            </Link>
            <Link href="/blog" className="text-neutral-700 hover:text-primary transition">
              Resources
            </Link>
            
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => signOut()}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary-dark text-white rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-700 hover:text-primary"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Home
            </Link>
            <Link href="/science" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Our Approach
            </Link>
            <Link href="/products" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Products
            </Link>
            <Link href="/providers" className="block px-3 py-2 text-neutral-600 hover:text-primary text-sm">
              For Providers
            </Link>
            <Link href="/blog" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Resources
            </Link>
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-primary font-semibold">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 text-neutral-700 hover:text-primary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-neutral-700 hover:text-primary">
                  Login
                </Link>
                <Link href="/register" className="block px-3 py-2 text-primary font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
4. Update app/page.tsx (Homepage)
tsximport { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { SciencePreview } from '@/components/home/SciencePreview';
import { ProductTeaser } from '@/components/home/ProductTeaser';
import { Testimonials } from '@/components/home/Testimonials';
import { ProvidersTeaser } from '@/components/home/ProvidersTeaser';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <SciencePreview />
      <ProductTeaser />
      <Testimonials />
      <ProvidersTeaser />
    </>
  );
}
5. Create components/home/HeroSection.tsx
tsximport Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/hero-family-hiking.jpg" 
          alt="Family achieving health goals together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-montserrat">
          Unlock Your Unique Health Potential.
          <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-secondary">
            Personalized Insights, Powered by Science.
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          Advanced DNA and microbiome testing combined with AI analysis to create your personalized health roadmap.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button 
              size="lg"
              className="bg-secondary hover:bg-secondary-dark text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all"
            >
              Discover Your Plan
            </Button>
          </Link>
          <Link href="/science">
            <Button 
              size="lg"
              variant="outline"
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-full px-8 py-6 text-lg font-semibold border-white/30"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Subtle AI Animation Hint */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
6. Create components/home/HowItWorks.tsx
tsxconst steps = [
  {
    icon: "📦",
    title: "Order Your Kit",
    description: "Choose from DNA, microbiome, or comprehensive testing packages"
  },
  {
    icon: "🧪",
    title: "Provide Sample",
    description: "Simple at-home collection with prepaid return shipping"
  },
  {
    icon: "🤖",
    title: "AI Analysis",
    description: "Our AI engine analyzes your data for personalized insights"
  },
  {
    icon: "🎯",
    title: "Achieve Goals",
    description: "Follow your custom health roadmap to reach your potential"
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-montserrat">
          How It Works
        </h2>
        <p className="text-xl text-neutral-600 text-center mb-12 max-w-3xl mx-auto">
          Your journey to personalized health starts with four simple steps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -z-10" />
              )}
              
              <div className="text-center group">
                <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl group-hover:shadow-xl transition-shadow">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
7. Update app/dashboard/page.tsx with enhanced UI
tsximport { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from 'react';
import { AriaWelcome } from "@/components/dashboard/AriaWelcome";
import { HealthMetricsCards } from "@/components/dashboard/HealthMetricsCards";
import { HealthTrends } from "@/components/dashboard/HealthTrends";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AriaChat } from "@/components/dashboard/AriaChat";
import { calculateHealthMetrics } from "@/lib/correlations";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get current metrics
  const metrics = await calculateHealthMetrics(session.user.id);

  // Get historical data
  const insights = await prisma.weeklyInsight.findMany({
    where: { userId: session.user.id },
    orderBy: { generatedAt: "desc" },
    take: 8,
  });

  const history = insights
    .map((insight) => ({
      week: `Week ${insight.weekNumber}`,
      cardiovascular: insight.cardiovascularScore || 0,
      metabolic: insight.metabolicScore || 0,
      inflammation: insight.inflammationScore || 0,
    }))
    .reverse();

  // Get recent reports
  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* AI Welcome Section */}
      <AriaWelcome userName={user?.name || 'there'} metrics={metrics} />
      
      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Health Metrics Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 font-montserrat">Your Health Scores</h2>
          <HealthMetricsCards metrics={metrics} />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Trends and Reports */}
          <div className="lg:col-span-2 space-y-8">
            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-64" />}>
              <HealthTrends history={history} />
            </Suspense>
            
            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-64" />}>
              <RecentReports reports={reports} />
            </Suspense>
          </div>

          {/* Right Column - Aria Chat */}
          <div className="lg:col-span-1">
            <AriaChat />
          </div>
        </div>
      </div>
    </div>
  );
}
8. Create components/dashboard/AriaWelcome.tsx
tsx'use client';

import { useEffect, useState } from 'react';

interface AriaWelcomeProps {
  userName: string;
  metrics: {
    cardiovascularScore: number;
    metabolicScore: number;
    inflammationScore: number;
  };
}

export function AriaWelcome({ userName, metrics }: AriaWelcomeProps) {
  const [greeting, setGreeting] = useState('');
  const [insight, setInsight] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Generate personalized insight based on metrics
    const scores = [
      { name: 'cardiovascular', score: metrics.cardiovascularScore },
      { name: 'metabolic', score: metrics.metabolicScore },
      { name: 'inflammation', score: metrics.inflammationScore },
    ];
    
    const bestScore = scores.reduce((a, b) => a.score < b.score ? a : b);
    const worstScore = scores.reduce((a, b) => a.score > b.score ? a : b);

    if (worstScore.score > 70) {
      setInsight(`Your ${worstScore.name} health needs attention. Let's focus on improving this today.`);
    } else if (bestScore.score < 40) {
      setInsight(`Your ${bestScore.name} health is excellent! Keep up the great work.`);
    } else {
      setInsight(`Your health metrics are balanced. Let's maintain this positive momentum.`);
    }
  }, [metrics]);

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting}, {userName}! 🌟
            </h1>
            <p className="text-lg opacity-90">
              {insight}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur animate-breathe">
              <span className="text-3xl">🤖</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
9. Create components/dashboard/HealthMetricsCards.tsx
tsx'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthMetricsCardsProps {
  metrics: {
    cardiovascularScore: number;
    metabolicScore: number;
    inflammationScore: number;
  };
}

export function HealthMetricsCards({ metrics }: HealthMetricsCardsProps) {
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-accent';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score < 40) return { text: 'Excellent', icon: TrendingDown };
    if (score < 70) return { text: 'Good', icon: Minus };
    return { text: 'Needs Attention', icon: TrendingUp };
  };

  const metricsData = [
    {
      title: 'Cardiovascular',
      score: metrics.cardiovascularScore,
      description: 'Heart and circulatory system health',
      icon: '❤️',
    },
    {
      title: 'Metabolic',
      score: metrics.metabolicScore,
      description: 'Energy and metabolism efficiency',
      icon: '⚡',
    },
    {
      title: 'Inflammation',
      score: metrics.inflammationScore,
      description: 'Immune system balance',
      icon: '🔥',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metricsData.map((metric) => {
        const status = getScoreStatus(metric.score);
        const StatusIcon = status.icon;
        
        return (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">{metric.title}</CardTitle>
                <span className="text-2xl">{metric.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`text-3xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}/100
                </div>
                <p className="text-sm text-neutral-600">{metric.description}</p>
                <div className="flex items-center gap-2 pt-2">
                  <StatusIcon className={`w-4 h-4 ${getScoreColor(metric.score)}`} />
                  <span className="text-sm font-medium">{status.text}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
10. Update components/upload/UploadCard.tsx with enhanced UI
tsx"use client";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, Dna, Microscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UploadCard() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [reportType, setReportType] = useState<"DNA" | "MICROBIOME" | "BLOOD_TEST">("BLOOD_TEST");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'DNA': return <Dna className="w-5 h-5" />;
      case 'MICROBIOME': return <Microscope className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);
      formData.append("type", reportType);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setSuccess(true);
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } catch (error) {
        console.error("Upload failed:", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Health Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={reportType}
            onValueChange={(value) => setReportType(value as any)}
            disabled={uploading}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLOOD_TEST">
                <div className="flex items-center gap-2">
                  {getReportIcon('BLOOD_TEST')}
                  Blood Test
                </div>
              </SelectItem>
              <SelectItem value="DNA">
                <div className="flex items-center gap-2">
                  {getReportIcon('DNA')}
                  DNA Report
                </div>
              </SelectItem>
              <SelectItem value="MICROBIOME">
                <div className="flex items-center gap-2">
                  {getReportIcon('MICROBIOME')}
                  Microbiome Report
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200 relative overflow-hidden
              ${isDragActive ? "border-primary bg-primary/5 scale-105" : "border-gray-300 hover:border-primary"}
              ${uploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} disabled={uploading} />
            
            {/* Background animation for drag */}
            {isDragActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse" />
            )}
            
            <div className="relative z-10">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                  <p className="text-primary font-medium">Uploading and analyzing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {isDragActive
                      ? "Drop your file here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, PNG, JPG, or TXT (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-accent bg-accent/10">
              <AlertDescription className="text-accent-dark">
                Report uploaded successfully! Aria is analyzing your data...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
11. Create components/dashboard/AriaChat.tsx (Enhanced ChatBot)
tsx"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AriaChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Aria, your AI health companion. Ask me anything about your health data, and I'll provide personalized insights based on your reports."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble processing that question. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What do my inflammation markers mean?",
    "How can I improve my metabolic score?",
    "What trends do you see in my health data?"
  ];

  return (
    <Card className="h-[600px] flex flex-col bg-white shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          Chat with Aria
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gradient-to-r from-primary to-accent rounded-full" />
                    <span className="text-xs font-medium text-gray-600">Aria</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(q)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask about your health data..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="bg-primary hover:bg-primary-dark"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
12. Create login and register pages with enhanced UI
File: app/login/page.tsx
tsx'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-3xl">🧬</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your health insights</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
13. Add stylish components for remaining pages
Create similar enhanced components for:

components/home/SciencePreview.tsx
components/home/ProductTeaser.tsx
components/home/Testimonials.tsx
components/dashboard/QuickActions.tsx
components/dashboard/HealthTrends.tsx
components/dashboard/RecentReports.tsx

14. Update global CSS (app/globals.css)
css@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-montserrat: 'Montserrat', sans-serif;
    --font-open-sans: 'Open Sans', sans-serif;
  }

  body {
    @apply font-open-sans;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-montserrat;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-neutral-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-neutral-400 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-500;
}
Key Integration Points

Authentication: Uses existing NextAuth setup with enhanced UI
File Upload: Enhanced UploadCard maintains existing functionality with better UX
AI Chat: AriaChat replaces basic ChatBot with conversation history and better UI
Health Metrics: Enhanced visualization while using existing correlation engine
Weekly Reports: Integrate with existing report generation API
Responsive Design: Mobile-first approach throughout

Assets to Add
Create these placeholder images in public/images/:

hero-family-hiking.jpg (1920x1080)
science-lab.jpg (1200x800)
dna-helix.svg
microbiome-icon.svg
blood-test-icon.svg

Remember to:

Install Google Fonts if not already configured
Test all existing backend functionality with new UI
Ensure mobile responsiveness throughout
Add loading states for async operations
Implement proper error boundaries


## Additional Windsurf Instructions

After implementing the above, tell Windsurf:

"Please implement these UI enhancements step by step:
1. First update the configuration files (tailwind.config.js, layout.tsx)
2. Create the navigation and homepage components
3. Enhance the dashboard with the new AriaWelcome and metric cards
4. Update the existing UploadCard and ChatBot with the new designs
5. Create login/register pages with the enhanced UI
6. Ensure all existing backend functionality (authentication, file upload, parsing, AI chat, report generation) continues to work with the new UI
7. Test mobile responsiveness on all pages

The goal is to create a beautiful, modern health platform UI that feels premium and trustworthy while maintaining all the existing functionality you've built. The design should blend clinical credibility with aspirational wellness, making complex health data feel accessible and actionable."

This implementation preserves all your existing backend work while creating a stunning frontend that matches your vision!