import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { SciencePreview } from '@/components/home/SciencePreview';
import { ProductTeaser } from '@/components/home/ProductTeaser';
import { Testimonials } from '@/components/home/Testimonials';
import { ProvidersTeaser } from '@/components/home/ProvidersTeaser';
import { PersonalizedHealthcareSection } from '@/components/home/PersonalizedHealthcareSection';
import { IntegrationsSection } from '@/components/home/IntegrationsSection';
import { PromoBanner } from '@/components/ui/PromoBanner';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PersonalizedHealthcareSection />
      <HowItWorks />
      <SciencePreview />
      <IntegrationsSection />
      <ProductTeaser />
      <Testimonials />
      <ProvidersTeaser />
      {/* Promo banner is fixed position, so it appears on page regardless of scroll position */}
      <PromoBanner />
    </>
  );
}
