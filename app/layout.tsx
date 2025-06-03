import './globals.css'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Navigation } from '@/components/layout/Navigation'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { DevTools } from '@/components/dev/DevTools'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
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
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans bg-background text-foreground">
        <AuthProvider>
          <Navigation />
          <main className="pt-16">
            {children}
          </main>
          <DevTools />
        </AuthProvider>
      </body>
    </html>
  )
}
