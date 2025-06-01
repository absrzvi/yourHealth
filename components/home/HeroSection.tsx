import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
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
