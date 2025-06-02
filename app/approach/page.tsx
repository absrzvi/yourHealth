import { Metadata } from 'next';
import { ApproachHero } from '@/components/approach/ApproachHero';
import { BiometricsContent } from '@/components/approach/BiometricsContent';
import { LLMSection } from '@/components/approach/LLMSection';
import { SystemBuildingSection } from '@/components/approach/SystemBuildingSection';

export const metadata: Metadata = {
  title: 'Our Approach - For Your Health',
  description: 'Learn about our data-driven approach to personalized health optimization using AI and advanced biometrics.',
};

export default function ApproachPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <ApproachHero />
      <BiometricsContent />
      <LLMSection />
      <SystemBuildingSection />
    </div>
  );
}
