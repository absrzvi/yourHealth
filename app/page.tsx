import { HeroSection } from '@/components/home/HeroSection';
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
